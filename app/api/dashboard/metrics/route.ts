import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCommitmentScore } from '@/lib/commitment-score';
import { subDays, subMonths, formatISO, differenceInDays, parseISO, startOfMonth, endOfMonth, format } from 'date-fns';

async function getAuth() {
  const { requireApiAuth } = await import('@/lib/auth/guards');
  return requireApiAuth();
}

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
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "1M"; // 1M, 3M, 6M, 1Y
    const auth = await getAuth();
    const { gymId, userProfile } = auth;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const now = new Date();

    // Fetch all active members with their data (include stored commitment_score when available)
    const { data: members } = await supabase
      .from('members')
      .select('id, first_name, last_name, joined_date, last_visit_date, churn_risk_score, churn_risk_level, status, membership_type_id, commitment_score')
      .eq('gym_id', gymId)
      .eq('status', 'active');

    if (!members || members.length === 0) {
      return NextResponse.json({
        totalMemberCount: 0,
        totalCampaignSends: 0,
        campaignsSentThisMonth: 0,
        atRiskCount: 0,
        avgCommitmentScore: 0,
        revenueAtRisk: 0,
        revenueSaved: 0,
        monthlyChurnPct: 0,
        reengagementRate: 0,
        habitDecayTrend: [],
        attentionNeeded: [],
        membersNotContacted10Plus: 0,
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

    let totalCampaignSends = 0;
    let campaignsSentThisMonth = 0;
    if (campaignIds.length > 0) {
      const [allRes, monthRes] = await Promise.all([
        supabase
          .from('campaign_sends')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds),
        supabase
          .from('campaign_sends')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
          .gte('sent_at', startOfMonth(now).toISOString())
          .lte('sent_at', endOfMonth(now).toISOString()),
      ]);
      totalCampaignSends = allRes.count ?? 0;
      campaignsSentThisMonth = monthRes.count ?? 0;
    }

    // Get unique re-engaged members and their revenue
    const reEngagedMemberIds = new Set(reEngagedSends?.map((s) => s.member_id) || []);
    const reEngagedMembers = members.filter((m) => reEngagedMemberIds.has(m.id));
    
    const revenueSaved = reEngagedMembers.reduce((sum, member) => {
      return sum + getMonthlyRevenue(member);
    }, 0);

    // Campaigns sent this month (computed above)
    // Monthly churn %: cancelled / (active + inactive + cancelled) for this gym
    const { count: cancelledCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'cancelled');
    const totalMembersAllStatus = members.length + (cancelledCount ?? 0);
    const monthlyChurnPct = totalMembersAllStatus > 0
      ? Math.round(((cancelledCount ?? 0) / totalMembersAllStatus) * 100)
      : 0;

    // Re-engagement rate: re-engaged / total sent in last 90 days
    const { count: sentLast90Count } = await supabase
      .from('campaign_sends')
      .select('*', { count: 'exact', head: true })
      .in('campaign_id', campaignIds)
      .gte('sent_at', subDays(now, 90).toISOString());
    const reengagementRate = (sentLast90Count ?? 0) > 0
      ? Math.round((reEngagedMemberIds.size / (sentLast90Count ?? 1)) * 100)
      : 0;

    // 5. Habit decay trend – monthly buckets, daily recalculation
    // Range: 1M (default), 3M, 6M, 1Y
    let monthsBack = 1;
    if (range === "3M") monthsBack = 3;
    else if (range === "6M") monthsBack = 6;
    else if (range === "1Y") monthsBack = 12;

    const habitDecayTrend: Array<{ date: string; dateLabel: string; avgCommitmentScore: number; memberCount: number }> = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const dateStr = formatISO(monthStart, { representation: "date" });
      const dateLabel = format(monthStart, "MMM yyyy");
      // Use current avg; in production could compute historical scores per month
      habitDecayTrend.push({
        date: dateStr,
        dateLabel,
        avgCommitmentScore,
        memberCount: members.length,
      });
    }

    // 6. Who needs attention today (top 10 most urgent)
    const attentionList = atRiskMembers
      .map((member) => {
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
        if (b.riskScore !== a.riskScore) {
          return b.riskScore - a.riskScore;
        }
        const aDays = a.daysSinceLastVisit ?? 999;
        const bDays = b.daysSinceLastVisit ?? 999;
        return bDays - aDays;
      })
      .slice(0, 10);

    const attentionIds = attentionList.map((a) => a.id);
    const todayStart = formatISO(now, { representation: 'date' });

    // Members are "engaged today" if: outreach sent, coach touch logged, or visit recorded today
    const engagedTodaySet = new Set<string>();

    if (attentionIds.length > 0) {
      const { data: todaySends } = await supabase
        .from('campaign_sends')
        .select('member_id')
        .in('member_id', attentionIds)
        .gte('sent_at', `${todayStart}T00:00:00`)
        .lt('sent_at', `${todayStart}T23:59:59.999`);
      todaySends?.forEach((s) => engagedTodaySet.add(s.member_id));

      const { data: todayTouches } = await adminClient
        .from('coach_touches')
        .select('member_id')
        .in('member_id', attentionIds)
        .gte('created_at', `${todayStart}T00:00:00`)
        .lt('created_at', `${todayStart}T23:59:59.999`);
      todayTouches?.forEach((t) => engagedTodaySet.add(t.member_id));

      const { data: todayVisits } = await adminClient
        .from('member_activities')
        .select('member_id')
        .in('member_id', attentionIds)
        .eq('activity_type', 'visit')
        .gte('activity_date', todayStart)
        .lte('activity_date', todayStart);
      todayVisits?.forEach((v) => engagedTodaySet.add(v.member_id));
    }

    const attentionNeeded = attentionList.map((a) => ({
      ...a,
      engagedToday: engagedTodaySet.has(a.id),
    }));

    // 8. Members not contacted in 10+ days (for inbox empty state)
    const tenDaysAgo = subDays(now, 10).toISOString();
    const contactedIn10Days = new Set<string>();
    if (campaignIds.length > 0) {
      const { data: recentSends } = await supabase
        .from('campaign_sends')
        .select('member_id')
        .in('campaign_id', campaignIds)
        .gte('sent_at', tenDaysAgo);
      recentSends?.forEach((s) => contactedIn10Days.add(s.member_id));
    }
    const { data: recentTouches } = await adminClient
      .from('coach_touches')
      .select('member_id')
      .eq('gym_id', gymId)
      .gte('created_at', tenDaysAgo);
    recentTouches?.forEach((t) => contactedIn10Days.add(t.member_id));
    const membersNotContacted10Plus = memberIds.filter((id) => !contactedIn10Days.has(id)).length;

    // 7. Last login snapshot for stat deltas
    const { data: lastSnapshot } = await supabase
      .from('user_metric_snapshots')
      .select('at_risk_count, avg_commitment_score, revenue_at_risk, revenue_saved, created_at')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      totalMemberCount: members.length,
      totalCampaignSends: totalCampaignSends ?? 0,
      campaignsSentThisMonth,
      atRiskCount,
      avgCommitmentScore,
      revenueAtRisk: Math.round(revenueAtRisk),
      revenueSaved: Math.round(revenueSaved),
      monthlyChurnPct,
      reengagementRate,
      habitDecayTrend,
      attentionNeeded,
      membersNotContacted10Plus,
      lastSnapshot: lastSnapshot
        ? {
            atRiskCount: lastSnapshot.at_risk_count,
            avgCommitmentScore: lastSnapshot.avg_commitment_score,
            revenueAtRisk: lastSnapshot.revenue_at_risk,
            revenueSaved: lastSnapshot.revenue_saved,
            snapshotAt: lastSnapshot.created_at,
          }
        : null,
    });
  } catch (error) {
    const { handleApiError } = await import('@/lib/api/response');
    return handleApiError(error, 'Dashboard metrics');
  }
}
