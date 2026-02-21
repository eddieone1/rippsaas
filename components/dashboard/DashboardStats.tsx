import { createClient } from "@/lib/supabase/server";
import StatsCard from "./StatsCard";

export default async function DashboardStats({ 
  gymId,
  primaryColor = "#2563EB",
  secondaryColor = "#1E40AF",
}: { 
  gymId: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const supabase = await createClient();

  // Get total active members
  const { count: totalMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("status", "active");

  // Get members at risk (high + medium)
  const { count: atRiskMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .in("churn_risk_level", ["high", "medium"]);

  // Calculate monthly churn percentage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Get members who were cancelled this month (status='cancelled' and updated this month)
  const { count: cancelledThisMonth } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("status", "cancelled")
    .gte("updated_at", startOfMonth.toISOString());

  // Get total members at start of month (all members that existed before this month)
  const { count: totalMembersAtStart } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .lt("created_at", startOfMonth.toISOString());

  // Calculate churn percentage
  // Churn rate = (Members cancelled this month) / (Total members at start of month) * 100
  // If no members at start, use current total as denominator to avoid division by zero
  const denominator = totalMembersAtStart && totalMembersAtStart > 0 
    ? totalMembersAtStart 
    : (totalMembers || 1);

  const monthlyChurnPercentage = denominator > 0
    ? Math.round((cancelledThisMonth || 0) / denominator * 100 * 10) / 10 // Round to 1 decimal place
    : 0;

  // Get campaigns sent this month

  // Get campaign IDs for this gym
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("gym_id", gymId);

  const campaignIds = campaigns?.map((c) => c.id) || [];

  const { count: campaignsSent } = await supabase
    .from("campaign_sends")
    .select("*", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .gte("sent_at", startOfMonth.toISOString());

  // Calculate re-engagement rate
  const { data: reEngagedData } = await supabase
    .from("campaign_sends")
    .select("member_re_engaged")
    .in("campaign_id", campaignIds)
    .eq("member_re_engaged", true)
    .gte("sent_at", startOfMonth.toISOString());

  const { count: totalCampaigns } = await supabase
    .from("campaign_sends")
    .select("*", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .gte("sent_at", startOfMonth.toISOString());

  const reEngagementRate =
    totalCampaigns && totalCampaigns > 0
      ? Math.round((reEngagedData?.length || 0) / totalCampaigns * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5" data-tour="stats-cards">
      <StatsCard
        title="Total Active Members"
        value={totalMembers || 0}
        icon="👥"
        primaryColor={primaryColor}
        tooltip="The total number of members with an active status. This includes all members who haven't cancelled their membership."
      />
      <StatsCard
        title="Members at Risk"
        value={atRiskMembers || 0}
        icon="⚠️"
        variant={atRiskMembers && atRiskMembers > 0 ? "warning" : "default"}
        primaryColor={primaryColor}
        tooltip="Members with high or medium churn risk levels. These members show signs of potential cancellation based on inactivity, distance, age, and other factors. Consider setting up plays to retain them."
      />
      <StatsCard
        title="Monthly Churn %"
        value={`${monthlyChurnPercentage}%`}
        icon="📉"
        variant={monthlyChurnPercentage >= 5 ? "danger" : monthlyChurnPercentage >= 3 ? "warning" : "default"}
        primaryColor={primaryColor}
        tooltip="The percentage of members who cancelled their membership this month. Calculated as: (Members cancelled this month) ÷ (Total members at start of month) × 100. A rate above 5% is concerning, while below 3% is healthy."
      />
      <StatsCard
        title="Outreach Sent (This Month)"
        value={campaignsSent || 0}
        icon="📧"
        primaryColor={primaryColor}
        tooltip="The total number of engagement messages (emails or SMS) sent to at-risk members this month. This helps track your retention efforts and outreach activity."
      />
      <StatsCard
        title="Re-engagement Rate"
        value={`${reEngagementRate}%`}
        icon="📈"
        primaryColor={primaryColor}
        tooltip="The percentage of members who returned after receiving an outreach message. This shows how effective your plays are at bringing members back. Higher rates indicate more successful retention efforts."
      />
    </div>
  );
}
