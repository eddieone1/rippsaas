import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";

/**
 * Dashboard KPI Strip - 5 cards showing key retention metrics
 * Risk-related metrics must stand out more than positive ones
 */
export default async function RetentionSnapshot({ gymId }: { gymId: string }) {
  const supabase = await createClient();

  // Get total active members
  const { count: totalMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("status", "active");

  // Get members at risk (high + medium) - THIS IS THE KEY METRIC
  const { count: atRiskMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("status", "active")
    .in("churn_risk_level", ["high", "medium"]);

  // Calculate monthly churn percentage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: cancelledThisMonth } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("status", "cancelled")
    .gte("updated_at", startOfMonth.toISOString());

  const { count: totalMembersAtStart } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .lt("created_at", startOfMonth.toISOString());

  const denominator = totalMembersAtStart && totalMembersAtStart > 0 
    ? totalMembersAtStart 
    : (totalMembers || 1);

  const monthlyChurnPercentage = denominator > 0
    ? Math.round((cancelledThisMonth || 0) / denominator * 100 * 10) / 10
    : 0;

  // Campaigns sent in last 7 days (not this month)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("gym_id", gymId);

  const campaignIds = campaigns?.map((c) => c.id) || [];

  const { count: campaignsSentLast7Days } = await supabase
    .from("campaign_sends")
    .select("*", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .gte("sent_at", sevenDaysAgo.toISOString());

  // Reengagement rate (this month)
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Active Members */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">👥</div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">Total Active Members</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalMembers || 0}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Members at Risk - HIGHLIGHTED */}
      <div className={`rounded-lg border-2 px-4 py-5 shadow-sm ${
        atRiskMembers && atRiskMembers > 0 
          ? "border-red-300 bg-red-50" 
          : "border-gray-200 bg-white"
      }`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">⚠️</div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-700">Members at Risk</dt>
              <dd className={`mt-1 text-2xl font-bold ${
                atRiskMembers && atRiskMembers > 0 ? "text-red-700" : "text-gray-900"
              }`}>
                {atRiskMembers || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Monthly Churn % */}
      <div className={`rounded-lg border-2 px-4 py-5 shadow-sm ${
        monthlyChurnPercentage >= 5 
          ? "border-red-300 bg-red-50"
          : monthlyChurnPercentage >= 3
          ? "border-yellow-300 bg-yellow-50"
          : "border-gray-200 bg-white"
      }`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">📉</div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-700">Monthly Churn %</dt>
              <dd className={`mt-1 text-2xl font-semibold ${
                monthlyChurnPercentage >= 5 
                  ? "text-red-700"
                  : monthlyChurnPercentage >= 3
                  ? "text-yellow-700"
                  : "text-gray-900"
              }`}>
                {monthlyChurnPercentage}%
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Campaigns Sent (Last 7 Days) */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">📧</div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">Campaigns Sent</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{campaignsSentLast7Days || 0}</dd>
              <dd className="text-xs text-gray-500 mt-1">Last 7 days</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Reengagement Rate */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">📈</div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">Reengagement Rate</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{reEngagementRate}%</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
