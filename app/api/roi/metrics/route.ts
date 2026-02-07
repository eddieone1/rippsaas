import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateMembersSaved,
  calculateRevenueRetained,
  calculateChurnReduction,
  calculateROIMultipleWithIntervention,
  calculateMonthlyTrend,
  calculateBaselineChurnRate,
  calculateCurrentChurnRate,
} from '@/lib/roi/calculations';
import { subMonths, subDays, formatISO } from 'date-fns';

export const dynamic = "force-dynamic";

/** Default time range: last 30 days (financial proof-of-value page) */
const DEFAULT_TIME_RANGE = '30days';

/** Conservative defaults for ROI (explainable, no black-box math) */
const DEFAULT_SOFTWARE_COST_GBP = 99;
const DEFAULT_INTERVENTION_COST_PER_ACTION_GBP = 5;
const MONTHS_RETAINED_PER_SAVED_MEMBER = 3;

/**
 * GET /api/roi/metrics
 *
 * Retention Impact: metrics from coach_actions, campaign_sends, member status.
 * Time range default = last 30 days. No fabricated data.
 */
export async function GET(request: Request) {
  try {
    const { gymId } = await requireAuth();
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || DEFAULT_TIME_RANGE;

    let startDate: Date;
    if (timeRange === '30days') {
      startDate = subDays(new Date(), 30);
    } else if (timeRange === '90days') {
      startDate = subDays(new Date(), 90);
    } else if (timeRange === '6months') {
      startDate = subMonths(new Date(), 6);
    } else if (timeRange === 'year') {
      startDate = subMonths(new Date(), 12);
    } else {
      startDate = subDays(new Date(), 30);
    }

    const startIso = formatISO(startDate);

    // Members (for revenue and churn; all members in gym for baseline)
    const { data: members } = await adminClient
      .from('members')
      .select('id, status, membership_type_id, joined_date, last_visit_date')
      .eq('gym_id', gymId);

    const membershipTypesRes = await adminClient
      .from('membership_types')
      .select('id, price, billing_frequency')
      .eq('gym_id', gymId)
      .eq('is_active', true);
    const membershipTypeMap = new Map(
      membershipTypesRes.data?.map((mt) => [mt.id, mt]) || []
    );

    const memberIds = members?.map((m) => m.id) || [];

    // Campaign sends with outcomes (in range)
    const { data: campaigns } = await adminClient
      .from('campaigns')
      .select('id')
      .eq('gym_id', gymId);
    const campaignIds = campaigns?.map((c) => c.id) || [];

    let campaignSends: { id: string; member_id: string; sent_at: string; outcome: string | null; days_to_return: number | null }[] = [];
    if (campaignIds.length > 0) {
      const res = await adminClient
        .from('campaign_sends')
        .select('id, member_id, sent_at, outcome, days_to_return')
        .in('campaign_id', campaignIds)
        .not('outcome', 'is', null)
        .gte('sent_at', startIso);
      campaignSends = res.data ?? [];
    }

    // Coach actions completed in range (data source: coach_actions completions)
    let totalCoachActions = 0;
    let firstInterventionAt: string | null = null;
    if (memberIds.length > 0) {
      const { data: actions } = await adminClient
        .from('coach_actions')
        .select('id, completed_at')
        .in('member_id', memberIds)
        .not('completed_at', 'is', null)
        .gte('completed_at', startIso);
      totalCoachActions = actions?.length ?? 0;
      const completedAts = (actions ?? [])
        .map((a) => a.completed_at)
        .filter(Boolean) as string[];
      if (completedAts.length > 0) {
        firstInterventionAt = completedAts.sort()[0];
      }
    }
    const firstCampaignSendAt =
      campaignSends.length > 0
        ? campaignSends.map((s) => s.sent_at).sort()[0]
        : null;
    if (!firstInterventionAt && firstCampaignSendAt) firstInterventionAt = firstCampaignSendAt;
    if (firstInterventionAt && firstCampaignSendAt && firstCampaignSendAt < firstInterventionAt) {
      firstInterventionAt = firstCampaignSendAt;
    }

    const hasMembers = (members?.length ?? 0) > 0;
    const hasInterventionData =
      (campaignSends?.length ?? 0) > 0 || totalCoachActions > 0;

    if (!members) {
      return NextResponse.json({
        membersSaved: 0,
        revenueRetained: 0,
        churnReduction: 0,
        roiMultiple: 0,
        monthlyTrend: [],
        baselineChurnRate: 0,
        currentChurnRate: 0,
        totalCoachActions: 0,
        interventionCost: 0,
        softwareCost: DEFAULT_SOFTWARE_COST_GBP,
        avgMembershipValueUsed: 30,
        sufficientData: false,
        hasInterventionData: false,
        firstInterventionAt: null,
        timeRange,
      });
    }

    const savedMemberIds = (campaignSends ?? [])
      .filter((s) => s.outcome === 're_engaged')
      .map((s) => s.member_id);
    const membersSaved = calculateMembersSaved(campaignSends ?? []);

    const revenueRetained = calculateRevenueRetained(
      savedMemberIds,
      members,
      membershipTypeMap,
      MONTHS_RETAINED_PER_SAVED_MEMBER
    );

    const membersChurned = (campaignSends ?? []).filter(
      (s) => s.outcome === 'no_response' || s.outcome === 'cancelled'
    ).length;
    const churnReduction = calculateChurnReduction(membersChurned, membersSaved);

    const softwareCost = DEFAULT_SOFTWARE_COST_GBP;
    const interventionCost =
      totalCoachActions * DEFAULT_INTERVENTION_COST_PER_ACTION_GBP;
    const roiMultiple = calculateROIMultipleWithIntervention(
      revenueRetained,
      interventionCost,
      softwareCost
    );

    const monthlyTrend = calculateMonthlyTrend(
      members,
      campaignSends ?? [],
      membershipTypeMap
    );

    const monthsOfData =
      timeRange === 'year' ? 12 : timeRange === '6months' ? 6 : timeRange === '90days' ? 3 : 1;
    const baselineChurnRate = calculateBaselineChurnRate(members, monthsOfData);
    const currentChurnRate = calculateCurrentChurnRate(
      members,
      campaignSends ?? [],
      monthsOfData
    );

    const avgMembershipValueUsed =
      members.length > 0
        ? members.reduce((sum, m) => {
            const mt = m.membership_type_id
              ? membershipTypeMap.get(m.membership_type_id)
              : null;
            const price = mt?.price ? Number(mt.price) : 30;
            const freq = mt?.billing_frequency || 'monthly';
            const monthly =
              freq === 'yearly' ? price / 12 : freq === 'quarterly' ? price / 3 : price;
            return sum + monthly;
          }, 0) / members.length
        : 30;

    return NextResponse.json({
      membersSaved,
      revenueRetained: Math.round(revenueRetained),
      churnReduction: Math.round(churnReduction * 10) / 10,
      roiMultiple: Math.round(roiMultiple * 10) / 10,
      monthlyTrend,
      baselineChurnRate: Math.round(baselineChurnRate * 10) / 10,
      currentChurnRate: Math.round(currentChurnRate * 10) / 10,
      totalCoachActions,
      interventionCost,
      softwareCost,
      avgMembershipValueUsed: Math.round(avgMembershipValueUsed * 10) / 10,
      sufficientData: hasMembers,
      hasInterventionData,
      firstInterventionAt,
      timeRange,
    });
  } catch (error) {
    console.error('ROI metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI metrics' },
      { status: 500 }
    );
  }
}
