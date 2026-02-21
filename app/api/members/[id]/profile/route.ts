import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCommitmentScore, calculateCommitmentScoreAsOf } from '@/lib/commitment-score';
import { calculateChurnRisk } from '@/lib/churn-risk';
import {
  getMemberStage,
  getEmotionalDisengagementFlags,
  getHabitDecayIndex,
  getBehaviourInterpretation,
  formatFlagKeyForDisplay,
  MEMBER_STAGE_LABELS,
} from '@/lib/member-intelligence';
import { differenceInDays, format, parseISO, subDays, formatISO } from 'date-fns';

/**
 * GET /api/members/[id]/profile
 * 
 * Returns comprehensive member profile data for retention actions:
 * - Commitment score and breakdown
 * - Habit decay timeline data
 * - Engagement history (visits, campaigns)
 * - Risk flags
 * - Coach assignment history
 * - Recommended next action
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { gymId } = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;
    
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Fetch member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .eq('gym_id', gymId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Fetch visit history
    const { data: activities } = await adminClient
      .from('member_activities')
      .select('activity_date, activity_type')
      .eq('member_id', memberId)
      .eq('activity_type', 'visit')
      .order('activity_date', { ascending: false });

    const visitDates = activities?.map((a) => a.activity_date) || [];

    // Calculate commitment score
    const commitmentResult = calculateCommitmentScore({
      joinedDate: member.joined_date,
      lastVisitDate: member.last_visit_date,
      visitDates,
      expectedVisitsPerWeek: 2,
    });

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const thirtyDaysAgoStr = format(subDays(now, 30), 'yyyy-MM-dd');
    const visitsLast30Days = visitDates.filter((d) => {
      const ds = (d || '').slice(0, 10);
      return ds >= thirtyDaysAgoStr && ds <= todayStr;
    }).length;
    const daysSinceJoined = differenceInDays(now, parseISO(member.joined_date));
    const daysSinceLastVisit = member.last_visit_date
      ? differenceInDays(now, parseISO(member.last_visit_date))
      : null;

    const churnResult = calculateChurnRisk({
      last_visit_date: member.last_visit_date,
      joined_date: member.joined_date,
      commitment_score: commitmentResult.score,
      visits_last_30_days: visitsLast30Days,
    });
    const churnProbability = churnResult.score;

    const memberStage = getMemberStage({
      status: member.status,
      churnRiskScore: churnProbability,
      churnRiskLevel: churnResult.level,
      commitmentScore: commitmentResult.score,
      habitDecayVelocity: commitmentResult.habitDecayVelocity,
      daysSinceJoined,
      daysSinceLastVisit,
      visitsLast30Days,
      riskFlags: commitmentResult.riskFlags,
      attendanceDecayScore: commitmentResult.factorScores.attendanceDecay,
    });

    const rawFlags = getEmotionalDisengagementFlags(
      commitmentResult.riskFlags,
      churnResult.level,
      commitmentResult.score,
      commitmentResult.habitDecayVelocity
    );

    const habitDecayIndex = getHabitDecayIndex(
      commitmentResult.factorScores.attendanceDecay,
      commitmentResult.factorScores.declineVelocity
    );

    // Payment failure stub: use days_payment_late or missed_payments when available
    const daysLate = (member as { days_payment_late?: number | null }).days_payment_late ?? 0;
    const missedPayments = (member as { missed_payments_count?: number | null }).missed_payments_count ?? 0;
    const paymentFailureCount = daysLate > 0 || missedPayments > 0 ? 1 : 0;

    const behaviourInterpretation = getBehaviourInterpretation(
      memberStage,
      commitmentResult.riskFlags,
      churnProbability,
      habitDecayIndex,
      visitsLast30Days,
      daysSinceLastVisit,
      paymentFailureCount
    );
    const emotionalDisengagementFlags = rawFlags.map((key) => formatFlagKeyForDisplay(key));

    // Update stored commitment + intelligence (async, non-blocking)
    void Promise.resolve(
      adminClient
        .from('members')
        .update({
          commitment_score: commitmentResult.score,
          commitment_score_calculated_at: new Date().toISOString(),
          churn_probability: churnProbability,
          member_stage: memberStage,
          habit_decay_index: habitDecayIndex,
          emotional_disengagement_flags: emotionalDisengagementFlags,
          behaviour_interpretation: behaviourInterpretation,
        })
        .eq('id', memberId)
    ).catch(() => {});

    // Fetch campaign history
    const { data: campaignSends } = await supabase
      .from('campaign_sends')
      .select(`
        *,
        campaigns (
          id,
          name,
          channel,
          trigger_days
        )
      `)
      .eq('member_id', memberId)
      .order('sent_at', { ascending: false });

    // Fetch coach assignments (history)
    // Note: Using separate queries for better compatibility
    const { data: coachAssignments } = await adminClient
      .from('member_coaches')
      .select('*')
      .eq('member_id', memberId)
      .order('assigned_at', { ascending: false });

    // Fetch coach details separately
    const coachDetails = new Map();
    if (coachAssignments && coachAssignments.length > 0) {
      const coachIds = Array.from(new Set(coachAssignments.map((ca: any) => ca.coach_id)));
      const assignerIds = Array.from(new Set(coachAssignments.map((ca: any) => ca.assigned_by).filter(Boolean)));
      const allUserIds = Array.from(new Set([...coachIds, ...assignerIds]));

      if (allUserIds.length > 0) {
        const { data: users } = await adminClient
          .from('users')
          .select('id, full_name, email')
          .in('id', allUserIds);

        users?.forEach((user: any) => {
          coachDetails.set(user.id, user);
        });
      }
    }

    // Get current coach
    const currentCoach = coachAssignments && coachAssignments.length > 0
      ? {
          id: coachAssignments[0].coach_id,
          name: coachDetails.get(coachAssignments[0].coach_id)?.full_name || 'Unknown',
          email: coachDetails.get(coachAssignments[0].coach_id)?.email || '',
          assignedAt: coachAssignments[0].assigned_at,
          assignedBy: coachAssignments[0].assigned_by 
            ? coachDetails.get(coachAssignments[0].assigned_by)?.full_name || null
            : null,
        }
      : null;

    // Build habit decay timeline (last 60 days): score as of each day with time decay (no flat line)
    const habitDecayTimeline: Array<{ date: string; visits: number; commitmentScore: number }> = [];
    const baseData = {
      joinedDate: member.joined_date,
      lastVisitDate: member.last_visit_date,
      visitDates,
      expectedVisitsPerWeek: 2,
    };

    for (let i = 59; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = formatISO(date, { representation: 'date' });
      const visitsUpToDate = visitDates.filter((v) => v <= dateStr).length;
      const scoreAsOf = calculateCommitmentScoreAsOf(baseData, dateStr).score;
      habitDecayTimeline.push({
        date: dateStr,
        visits: visitsUpToDate,
        commitmentScore: scoreAsOf,
      });
    }

    // Build engagement history (visits + campaigns)
    const engagementHistory: { type: string; date: string; title: string; description: string; metadata: Record<string, unknown> }[] = [];
    
    // Add visits
    activities?.forEach((activity) => {
      engagementHistory.push({
        type: 'visit',
        date: activity.activity_date,
        title: 'Gym Visit',
        description: 'Member visited the gym',
        metadata: {
          activityType: activity.activity_type,
        },
      });
    });

    // Add campaigns
    campaignSends?.forEach((send: any) => {
      const campaign = send.campaigns;
      engagementHistory.push({
        type: 'campaign',
        date: send.sent_at.split('T')[0],
        title: campaign?.name || 'Campaign',
        description: `Sent via ${campaign?.channel || 'email'}`,
        metadata: {
          channel: campaign?.channel,
          reEngaged: send.member_re_engaged,
          outcome: send.outcome,
        },
      });
    });

    // Add coach touches
    const { data: coachTouches } = await adminClient
      .from('coach_touches')
      .select('id, coach_id, channel, type, outcome, notes, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    const coachNames = new Map<string, string>();
    if (coachTouches && coachTouches.length > 0) {
      const coachIds = Array.from(new Set(coachTouches.map((t: any) => t.coach_id)));
      const { data: coaches } = await adminClient
        .from('users')
        .select('id, full_name')
        .in('id', coachIds);
      coaches?.forEach((c: any) => coachNames.set(c.id, c.full_name || 'Unknown'));
    }

    coachTouches?.forEach((touch: any) => {
      const coachName = coachNames.get(touch.coach_id) || 'Coach';
      const dateStr = touch.created_at?.split('T')[0] || touch.created_at;
      engagementHistory.push({
        type: 'coach_touch',
        date: dateStr,
        title: `Coach touch (${touch.channel?.replace('_', ' ') || 'contact'})`,
        description: `${coachName}: ${touch.outcome?.replace('_', ' ') || ''}${touch.notes ? ` — ${touch.notes}` : ''}`,
        metadata: {
          channel: touch.channel,
          outcome: touch.outcome,
          coachName: coachNames.get(touch.coach_id),
        },
      });
    });

    // Sort by date (most recent first)
    engagementHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Generate recommended next action
    const recommendedAction = generateRecommendedAction(
      member,
      commitmentResult,
      campaignSends || [],
      currentCoach
    );

    // Get available coaches for assignment
    const { data: availableCoaches } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('gym_id', gymId)
      .eq('role', 'coach')
      .order('full_name', { ascending: true });

    return NextResponse.json({
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        phone: member.phone,
        joinedDate: member.joined_date,
        lastVisitDate: member.last_visit_date,
        status: member.status,
        churnRiskScore: member.churn_risk_score,
        churnRiskLevel: member.churn_risk_level,
        specialNotes: (member as { special_notes?: string | null }).special_notes ?? null,
      },
      memberIntelligence: {
        memberStage,
        memberStageLabel: MEMBER_STAGE_LABELS[memberStage],
        churnProbability,
        habitDecayIndex,
        emotionalDisengagementFlags,
        behaviourInterpretation,
      },
      commitmentScore: {
        score: commitmentResult.score,
        habitDecayVelocity: commitmentResult.habitDecayVelocity,
        riskFlags: commitmentResult.riskFlags,
        factorScores: commitmentResult.factorScores,
      },
      habitDecayTimeline,
      engagementHistory: engagementHistory.slice(0, 50), // Last 50 events
      currentCoach,
      coachHistory: coachAssignments?.map((ca: any) => ({
        coach: {
          id: ca.coach_id,
          name: coachDetails.get(ca.coach_id)?.full_name || 'Unknown',
          email: coachDetails.get(ca.coach_id)?.email || '',
        },
        assignedAt: ca.assigned_at,
        assignedBy: ca.assigned_by 
          ? coachDetails.get(ca.assigned_by)?.full_name || null
          : null,
        notes: ca.notes,
      })) || [],
      recommendedAction,
      availableCoaches: availableCoaches || [],
    });
  } catch (error) {
    console.error('Member profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member profile' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommended next action based on member state
 */
function generateRecommendedAction(
  member: any,
  commitmentResult: any,
  campaignSends: any[],
  currentCoach: any
): {
  action: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedCampaign?: string;
} {
  // High risk + low commitment = urgent
  if (member.churn_risk_level === 'high' && commitmentResult.score < 40) {
    const lastCampaign = campaignSends[0];
    const daysSinceCampaign = lastCampaign
      ? Math.floor((new Date().getTime() - new Date(lastCampaign.sent_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceCampaign > 7) {
      return {
        action: 'Send re-engagement campaign',
        priority: 'high',
        reason: 'High risk member with low commitment score. No recent campaign sent.',
        suggestedCampaign: '30+ Days Inactive',
      };
    }

    if (!currentCoach) {
      return {
        action: 'Assign coach for personal outreach',
        priority: 'high',
        reason: 'High risk member needs personal attention. No coach assigned.',
      };
    }

    return {
      action: 'Coach should make personal contact',
      priority: 'high',
      reason: 'High risk member. Coach should reach out directly.',
    };
  }

  // Medium risk + declining commitment
  if (member.churn_risk_level === 'medium' && commitmentResult.habitDecayVelocity < -0.5) {
    return {
      action: 'Send engagement campaign',
      priority: 'medium',
      reason: 'Commitment declining. Early intervention needed.',
      suggestedCampaign: '14 Days Inactive',
    };
  }

  // No recent visits
  if (commitmentResult.riskFlags.noRecentVisits) {
    return {
      action: 'Send check in message',
      priority: 'medium',
      reason: 'No visits in last 14 days. Check in to understand barriers.',
      suggestedCampaign: '14 Days Inactive',
    };
  }

  // Large gap between visits
  if (commitmentResult.riskFlags.largeGap) {
    return {
      action: 'Investigate reason for gap',
      priority: 'medium',
      reason: 'Large gap between visits detected. May indicate life changes or barriers.',
    };
  }

  // New member low attendance
  if (commitmentResult.riskFlags.newMemberLowAttendance) {
    return {
      action: 'Onboarding support',
      priority: 'medium',
      reason: 'New member with low attendance. Help establish routine.',
    };
  }

  // Default: monitor
  return {
    action: 'Continue monitoring',
    priority: 'low',
    reason: 'Member showing stable engagement patterns.',
  };
}
