import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCommitmentScore } from '@/lib/commitment-score';
import { subDays, formatISO, differenceInDays, parseISO } from 'date-fns';

/**
 * GET /api/dashboard/metrics
 * 
 * Returns all dashboard metrics:
 * - At-risk member count
 * - Average commitment score
 * - Revenue at risk
 * - Revenue saved
 * - Habit decay trend data
 * - Members needing attention today
 */
export async function GET(request: Request) {
  try {
    const { gymId } = await requireAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Fetch all active members with their data (include stored commitment_score when available)
    const { data: members } = await supabase
      .from('members')
      .select('id, first_name, last_name, joined_date, last_visit_date, churn_risk_score, churn_risk_level, status, membership_type_id, commitment_score')
      .eq('gym_id', gymId)
      .eq('status', 'active');

    if (!members || members.length === 0) {
      return NextResponse.json({
        atRiskCount: 0,
        avgCommitmentScore: 0,
        revenueAtRisk: 0,
        revenueSaved: 0,
        habitDecayTrend: [],
        attentionNeeded: [],
      });
    }

    // Fetch membership types for revenue calculation
    const { data: membershipTypes } = await supabase
      .from('membership_types')
      .select('id, name, price, billing_frequency')
      .eq('gym_id', gymId)
      .eq('is_active', true);

    // Create membership type lookup
    const membershipTypeMap = new Map(
      membershipTypes?.map((mt) => [mt.id, mt]) || []
    );

    // Calculate monthly revenue per member
    const getMonthlyRevenue = (member: any): number => {
      if (!member.membership_type_id) {
        // Default: assume £30/month if no membership type
        return 30;
      }
      const membershipType = membershipTypeMap.get(member.membership_type_id);
      if (!membershipType || !membershipType.price) {
        return 30; // Default
      }

      // Convert to monthly revenue
      const price = Number(membershipType.price);
      switch (membershipType.billing_frequency) {
        case 'monthly':
          return price;
        case 'quarterly':
          return price / 3;
        case 'yearly':
          return price / 12;
        default:
          return price; // Assume monthly
      }
    };

    // 1. At-risk member count (high + medium risk)
    const atRiskMembers = members.filter(
      (m) => m.churn_risk_level === 'high' || m.churn_risk_level === 'medium'
    );
    const atRiskCount = atRiskMembers.length;

    // 2. Batch fetch all visit activities for all members (one query instead of N)
    const memberIds = members.map((m) => m.id);
    const { data: allVisitActivities } = await adminClient
      .from('member_activities')
      .select('member_id, activity_date')
      .eq('activity_type', 'visit')
      .in('member_id', memberIds)
      .order('activity_date', { ascending: false });

    const visitDatesByMember = new Map<string, string[]>();
    allVisitActivities?.forEach((a) => {
      if (!visitDatesByMember.has(a.member_id)) {
        visitDatesByMember.set(a.member_id, []);
      }
      visitDatesByMember.get(a.member_id)!.push(a.activity_date);
    });

    // Use stored commitment_score when available, else compute
    const commitmentScores: number[] = [];
    for (const member of members) {
      const stored = (member as { commitment_score?: number | null }).commitment_score;
      if (typeof stored === 'number' && stored >= 0 && stored <= 100) {
        commitmentScores.push(stored);
      } else {
        const visitDates = visitDatesByMember.get(member.id) ?? [];
        const result = calculateCommitmentScore({
          joinedDate: member.joined_date,
          lastVisitDate: member.last_visit_date,
          visitDates,
          expectedVisitsPerWeek: 2,
        });
        commitmentScores.push(result.score);
      }
    }

    const avgCommitmentScore = commitmentScores.length > 0
      ? Math.round(commitmentScores.reduce((sum, score) => sum + score, 0) / commitmentScores.length)
      : 0;

    // 3. Revenue at risk (at-risk members' monthly revenue)
    const revenueAtRisk = atRiskMembers.reduce((sum, member) => {
      return sum + getMonthlyRevenue(member);
    }, 0);

    // 4. Revenue saved (members who re-engaged after campaigns)
    // Calculate based on campaign sends that resulted in re-engagement
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('gym_id', gymId);

    const campaignIds = campaigns?.map((c) => c.id) || [];

    const { data: reEngagedSends } = await supabase
      .from('campaign_sends')
      .select('member_id')
      .in('campaign_id', campaignIds)
      .eq('member_re_engaged', true)
      .gte('sent_at', subDays(new Date(), 90).toISOString()); // Last 90 days

    // Get unique re-engaged members and their revenue
    const reEngagedMemberIds = new Set(reEngagedSends?.map((s) => s.member_id) || []);
    const reEngagedMembers = members.filter((m) => reEngagedMemberIds.has(m.id));
    
    const revenueSaved = reEngagedMembers.reduce((sum, member) => {
      return sum + getMonthlyRevenue(member);
    }, 0);

    // 5. Habit decay trend (last 30 days)
    // Use current avg score for all dates (simplified for MVP)
    const habitDecayTrend = [];
    const now = new Date();

    // Calculate trend (simplified: use current avg for all dates)
    // In production, could calculate historical scores
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = formatISO(date, { representation: 'date' });
      
      habitDecayTrend.push({
        date: dateStr,
        dateLabel: formatISO(date, { representation: 'date' }),
        avgCommitmentScore: avgCommitmentScore, // Use current avg (simplified)
        memberCount: members.length,
      });
    }

    // 6. Who needs attention today (top 10 most urgent)
    const attentionNeeded = atRiskMembers
      .map((member) => {
        // Fetch visit history for commitment score
        // For performance, we'll use a simplified approach
        const daysSinceLastVisit = member.last_visit_date
          ? differenceInDays(now, parseISO(member.last_visit_date))
          : null;

        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          riskLevel: member.churn_risk_level,
          riskScore: member.churn_risk_score,
          daysSinceLastVisit,
          lastVisitDate: member.last_visit_date,
          monthlyRevenue: getMonthlyRevenue(member),
        };
      })
      .sort((a, b) => {
        // Sort by risk score (highest first), then by days inactive
        if (b.riskScore !== a.riskScore) {
          return b.riskScore - a.riskScore;
        }
        const aDays = a.daysSinceLastVisit ?? 999;
        const bDays = b.daysSinceLastVisit ?? 999;
        return bDays - aDays;
      })
      .slice(0, 10);

    return NextResponse.json({
      atRiskCount,
      avgCommitmentScore,
      revenueAtRisk: Math.round(revenueAtRisk),
      revenueSaved: Math.round(revenueSaved),
      habitDecayTrend,
      attentionNeeded,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
