/**
 * ROI and retention metrics calculations.
 * Used by /api/roi/metrics for the financial proof-of-value page.
 */

import { formatISO, startOfMonth } from "date-fns";

export interface CampaignSendRow {
  id: string;
  member_id: string;
  sent_at: string;
  outcome: string | null;
  days_to_return: number | null;
}

export interface MemberRow {
  id: string;
  status?: string;
  membership_type_id?: string | null;
  joined_date?: string;
  last_visit_date?: string | null;
}

export interface MembershipTypeRow {
  id: string;
  price?: number;
  billing_frequency?: string | null;
}

/**
 * Count members considered "saved" (re-engaged = made another visit) from campaign sends.
 */
export function calculateMembersSaved(campaignSends: CampaignSendRow[]): number {
  return campaignSends.filter((s) => s.outcome === "re_engaged").length;
}

/**
 * Monthly value of a membership (GBP).
 */
function monthlyValue(
  member: MemberRow,
  membershipTypeMap: Map<string, MembershipTypeRow>
): number {
  const mt = member.membership_type_id
    ? membershipTypeMap.get(member.membership_type_id)
    : null;
  const price = mt?.price != null ? Number(mt.price) : 30;
  const freq = mt?.billing_frequency || "monthly";
  if (freq === "yearly") return price / 12;
  if (freq === "quarterly") return price / 3;
  return price;
}

/**
 * Revenue retained from saved members over a number of months (GBP).
 */
export function calculateRevenueRetained(
  savedMemberIds: string[],
  members: MemberRow[],
  membershipTypeMap: Map<string, MembershipTypeRow>,
  monthsRetained: number
): number {
  const memberById = new Map(members.map((m) => [m.id, m]));
  let total = 0;
  for (const id of savedMemberIds) {
    const member = memberById.get(id);
    if (!member) continue;
    total += monthlyValue(member, membershipTypeMap) * monthsRetained;
  }
  return total;
}

/**
 * Churn reduction metric: net effect (saved minus churned), can be negative.
 */
export function calculateChurnReduction(
  membersChurned: number,
  membersSaved: number
): number {
  return membersSaved - membersChurned;
}

/**
 * ROI multiple: revenue retained per pound spent (intervention + software).
 */
export function calculateROIMultipleWithIntervention(
  revenueRetained: number,
  interventionCost: number,
  softwareCost: number
): number {
  const totalCost = interventionCost + softwareCost;
  if (totalCost <= 0) return revenueRetained > 0 ? 999 : 0;
  return revenueRetained / totalCost;
}

export interface MonthlyTrendPoint {
  month: string;
  membersSaved: number;
  revenueRetained: number;
}

/**
 * Monthly trend of saved members and revenue retained.
 */
export function calculateMonthlyTrend(
  members: MemberRow[],
  campaignSends: CampaignSendRow[],
  membershipTypeMap: Map<string, MembershipTypeRow>
): MonthlyTrendPoint[] {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const reengagedSends = campaignSends.filter((s) => s.outcome === "re_engaged");
  const byMonth = new Map<string, { saved: number; memberIds: Set<string> }>();

  for (const s of reengagedSends) {
    const monthKey = formatISO(startOfMonth(new Date(s.sent_at)), {
      representation: "date",
    });
    let entry = byMonth.get(monthKey);
    if (!entry) {
      entry = { saved: 0, memberIds: new Set() };
      byMonth.set(monthKey, entry);
    }
    if (!entry.memberIds.has(s.member_id)) {
      entry.memberIds.add(s.member_id);
      entry.saved += 1;
    }
  }

  const sortedMonths = Array.from(byMonth.keys()).sort();
  return sortedMonths.map((month) => {
    const entry = byMonth.get(month)!;
    let revenue = 0;
    for (const id of Array.from(entry.memberIds)) {
      const member = memberById.get(id);
      if (member) revenue += monthlyValue(member, membershipTypeMap) * 3;
    }
    return {
      month,
      membersSaved: entry.saved,
      revenueRetained: Math.round(revenue),
    };
  });
}

/**
 * Baseline churn rate (fraction 0–1) over the period.
 */
export function calculateBaselineChurnRate(
  members: MemberRow[],
  monthsOfData: number
): number {
  if (members.length === 0) return 0;
  const cancelled = members.filter((m) => m.status === "cancelled").length;
  return cancelled / members.length;
}

/**
 * Current churn rate (fraction 0–1) accounting for period and outcomes.
 */
export function calculateCurrentChurnRate(
  members: MemberRow[],
  campaignSends: CampaignSendRow[],
  monthsOfData: number
): number {
  if (members.length === 0) return 0;
  const cancelled = members.filter((m) => m.status === "cancelled").length;
  const reengaged = new Set(
    campaignSends.filter((s) => s.outcome === "re_engaged").map((s) => s.member_id)
  );
  const effectiveCancelled = members.filter(
    (m) => m.status === "cancelled" && !reengaged.has(m.id)
  ).length;
  return effectiveCancelled / members.length;
}
