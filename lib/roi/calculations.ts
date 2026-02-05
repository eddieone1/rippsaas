/**
 * ROI Calculation Logic
 * 
 * Calculates retention impact metrics:
 * - Members saved (re-engaged after intervention)
 * - Revenue retained (from saved members)
 * - Churn reduction % (before vs after)
 * - ROI multiple (revenue retained / software cost)
 */

interface MemberData {
  id: string;
  status: string;
  membership_type_id: string | null;
  joined_date: string;
  last_visit_date: string | null;
}

interface MembershipType {
  id: string;
  price: number | null;
  billing_frequency: string | null;
}

/** Outcome from campaign_sends; API may return string from DB */
interface CampaignSend {
  id: string;
  member_id: string;
  sent_at: string;
  outcome: string | null;
  days_to_return: number | null;
}

interface MonthlyData {
  month: string; // YYYY-MM format
  membersAtStart: number;
  membersChurned: number;
  membersReengaged: number;
  revenueRetained: number;
}

/**
 * Calculate monthly revenue for a member based on membership type
 */
export function calculateMonthlyRevenue(
  member: MemberData,
  membershipTypes: Map<string, MembershipType>
): number {
  if (!member.membership_type_id) {
    return 30; // Default assumption: £30/month
  }

  const membershipType = membershipTypes.get(member.membership_type_id);
  if (!membershipType || !membershipType.price) {
    return 30; // Default
  }

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
}

/**
 * Calculate members saved (re-engaged after intervention)
 */
export function calculateMembersSaved(campaignSends: CampaignSend[]): number {
  return campaignSends.filter((send) => send.outcome === 're_engaged').length;
}

/**
 * Calculate revenue retained from saved members
 */
export function calculateRevenueRetained(
  savedMemberIds: string[],
  members: MemberData[],
  membershipTypes: Map<string, MembershipType>,
  monthsRetained: number = 3 // Default: assume 3 months retention
): number {
  let totalRevenue = 0;

  for (const memberId of savedMemberIds) {
    const member = members.find((m) => m.id === memberId);
    if (!member) continue;

    const monthlyRevenue = calculateMonthlyRevenue(member, membershipTypes);
    totalRevenue += monthlyRevenue * monthsRetained;
  }

  return totalRevenue;
}

/**
 * Calculate churn reduction percentage
 * 
 * Formula: (Members Re-engaged / (Members Churned + Members Re-engaged)) * 100
 * 
 * This shows what % of potential churn was prevented
 */
export function calculateChurnReduction(
  membersChurned: number,
  membersReengaged: number
): number {
  const totalAtRisk = membersChurned + membersReengaged;
  if (totalAtRisk === 0) return 0;

  return (membersReengaged / totalAtRisk) * 100;
}

/**
 * Calculate ROI multiple (simple: revenue / software cost)
 */
export function calculateROIMultiple(
  revenueRetained: number,
  softwareCost: number
): number {
  if (softwareCost === 0) return 0;
  return revenueRetained / softwareCost;
}

/**
 * Calculate ROI multiple (financial proof-of-value)
 *
 * Formula: (Revenue Retained − Estimated Intervention Cost) / Software Cost
 *
 * Conservative: subtracts cost of coach time/interventions so the multiple
 * reflects true net value. Example: £900 retained − £150 intervention cost
 * ÷ £99 software = 7.6x ROI.
 */
export function calculateROIMultipleWithIntervention(
  revenueRetained: number,
  interventionCost: number,
  softwareCost: number
): number {
  if (softwareCost === 0) return 0;
  const netValue = Math.max(0, revenueRetained - interventionCost);
  return netValue / softwareCost;
}

/**
 * Calculate before vs after monthly data
 * 
 * Groups data by month to show trend over time
 */
export function calculateMonthlyTrend(
  members: MemberData[],
  campaignSends: CampaignSend[],
  membershipTypes: Map<string, MembershipType>
): MonthlyData[] {
  // Get date range (last 12 months)
  const now = new Date();
  const months: MonthlyData[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Count members at start of month (joined before or during month)
    const membersAtStart = members.filter((m) => {
      const joinedDate = new Date(m.joined_date);
      return joinedDate <= new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }).length;

    // Count churned members (status = cancelled, cancelled in this month)
    // Note: This is simplified - in real system, track cancellation dates
    const membersChurned = 0; // Placeholder - would need cancellation_date field

    // Count re-engaged members (campaign sends with re_engaged outcome in this month)
    const monthSends = campaignSends.filter((send) => {
      const sendDate = new Date(send.sent_at);
      return (
        sendDate.getFullYear() === date.getFullYear() &&
        sendDate.getMonth() === date.getMonth() &&
        send.outcome === 're_engaged'
      );
    });

    const membersReengaged = monthSends.length;

    // Calculate revenue retained for this month
    const savedMemberIds = monthSends.map((s) => s.member_id);
    const revenueRetained = calculateRevenueRetained(
      savedMemberIds,
      members,
      membershipTypes,
      1 // 1 month for this specific month
    );

    months.push({
      month: monthKey,
      membersAtStart,
      membersChurned,
      membersReengaged,
      revenueRetained,
    });
  }

  return months;
}

/**
 * Calculate baseline churn rate (before interventions)
 * 
 * Uses first 3 months of data or industry average if insufficient data
 */
export function calculateBaselineChurnRate(
  members: MemberData[],
  monthsOfData: number
): number {
  if (members.length === 0) return 5.0; // Industry average: ~5% monthly churn

  // Simplified: assume baseline churn based on cancelled members
  // In real system, would track cancellation dates
  const cancelledMembers = members.filter((m) => m.status === 'cancelled').length;
  const totalMembers = members.length;

  if (totalMembers === 0) return 5.0;

  // Estimate monthly churn rate
  const overallChurnRate = (cancelledMembers / totalMembers) * 100;
  return overallChurnRate / Math.max(monthsOfData, 1); // Average per month
}

/**
 * Calculate current churn rate (with interventions)
 */
export function calculateCurrentChurnRate(
  members: MemberData[],
  campaignSends: CampaignSend[],
  monthsOfData: number
): number {
  if (members.length === 0) return 0;

  const baselineChurn = calculateBaselineChurnRate(members, monthsOfData);
  const membersReengaged = campaignSends.filter(
    (s) => s.outcome === 're_engaged'
  ).length;
  const totalMembers = members.length;

  // Adjusted churn = baseline - (re-engaged / total members)
  const churnReduction = (membersReengaged / totalMembers) * 100;
  return Math.max(0, baselineChurn - churnReduction);
}
