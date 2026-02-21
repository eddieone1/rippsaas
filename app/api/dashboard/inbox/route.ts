import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";
import { subDays, format, differenceInDays, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export type InboxItem = {
  id: string;
  type: "at_risk_increase" | "campaign_insight" | "visits_24h" | "new_touches" | "new_clients" | "birthdays" | "monthly_summary";
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
};

/**
 * GET /api/dashboard/inbox
 *
 * Returns up to 5 rotating inbox items: at-risk changes, campaign insights,
 * visits, new touches, new clients, birthdays, monthly summary.
 */
export async function GET(request: Request) {
  try {
    const { gymId, userProfile } = await requireApiAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);

    const items: InboxItem[] = [];
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");

    // 1. At-risk increase (compare to 7 days ago)
    const { data: membersNow } = await supabase
      .from("members")
      .select("id, churn_risk_level")
      .eq("gym_id", gymId)
      .eq("status", "active");

    const atRiskNow = membersNow?.filter(
      (m) => m.churn_risk_level === "high" || m.churn_risk_level === "medium"
    ).length ?? 0;

    // Simplified: we don't have historical at-risk, so use a delta placeholder or skip
    items.push({
      id: "at_risk",
      type: "at_risk_increase",
      title: `${atRiskNow} members at risk`,
      description: "Members flagged as medium or high churn risk needing attention.",
      actionHref: "/members/at-risk",
      actionLabel: "View at-risk",
      metadata: { count: atRiskNow },
    });

    // 2. Visits in last 24h (member_activities) or since last login
    const lastLogin = (userProfile as { last_login_at?: string | null }).last_login_at;
    const sinceDate = lastLogin
      ? parseISO(lastLogin.split("T")[0])
      : subDays(now, 1);
    const sinceStr = format(sinceDate, "yyyy-MM-dd");

    const { data: visitRows } = await adminClient
      .from("member_activities")
      .select("member_id")
      .eq("activity_type", "visit")
      .gte("activity_date", sinceStr)
      .lte("activity_date", todayStr);

    const visitCount = new Set(visitRows?.map((r) => r.member_id) || []).size;
    const visitLabel = lastLogin
      ? "clients visited since your last login"
      : "clients visited in last 24 hours";
    items.push({
      id: "visits",
      type: "visits_24h",
      title: `${visitCount} ${visitLabel}`,
      description: "Member check-ins recorded.",
      actionHref: "/members",
      actionLabel: "View members",
      metadata: { count: visitCount },
    });

    // 3. New touches / plays in last 7 days
    const sevenDaysAgo = format(subDays(now, 7), "yyyy-MM-dd");
    const { data: touchRows } = await adminClient
      .from("coach_touches")
      .select("id")
      .eq("gym_id", gymId)
      .gte("created_at", sevenDaysAgo);

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("gym_id", gymId);
    const campaignIds = campaigns?.map((c) => c.id) || [];
    let playSends = 0;
    if (campaignIds.length > 0) {
      const { data: sendRows } = await supabase
        .from("campaign_sends")
        .select("id")
        .in("campaign_id", campaignIds)
        .gte("sent_at", sevenDaysAgo);
      playSends = sendRows?.length ?? 0;
    }

    const touchCount = (touchRows?.length ?? 0) + playSends;
    items.push({
      id: "touches",
      type: "new_touches",
      title: `${touchCount} touches in last 7 days`,
      description: "Coach touches and campaign sends combined.",
      actionHref: "/campaigns",
      actionLabel: "View campaigns",
      metadata: { count: touchCount },
    });

    // 4. New clients (joined in last 7 days)
    const { data: newMemberRows } = await supabase
      .from("members")
      .select("id")
      .eq("gym_id", gymId)
      .gte("joined_date", sevenDaysAgo);

    const newClientsCount = newMemberRows?.length ?? 0;
    items.push({
      id: "new_clients",
      type: "new_clients",
      title: `${newClientsCount} new clients joined`,
      description: "In the last 7 days.",
      actionHref: "/members",
      actionLabel: "View members",
      metadata: { count: newClientsCount },
    });

    // 5. Upcoming birthdays (this month) - date_of_birth may not exist on all schemas
    let birthdayCount = 0;
    try {
      const { data: membersWithDob } = await supabase
        .from("members")
        .select("id, date_of_birth")
        .eq("gym_id", gymId)
        .not("date_of_birth", "is", null);

      const thisMonth = now.getMonth();
      birthdayCount =
        membersWithDob?.filter((m) => {
          const dob = (m as { date_of_birth?: string | null }).date_of_birth;
          if (!dob) return false;
          const d = new Date(String(dob));
          return d.getMonth() === thisMonth;
        }).length ?? 0;
    } catch {
      // date_of_birth column may not exist
    }

    items.push({
      id: "birthdays",
      type: "birthdays",
      title: `${birthdayCount} upcoming birthdays this month`,
      description: "Consider sending a birthday message or offer.",
      actionHref: "/members?birthdays=this_month",
      actionLabel: "View birthdays",
      metadata: { count: birthdayCount },
    });

    // 6. Monthly summary (previous month)
    const prevMonth = subDays(now, 30);
    const prevMonthStart = format(prevMonth, "yyyy-MM-01");
    const prevMonthEnd = format(prevMonth, "yyyy-MM-dd");
    items.push({
      id: "monthly",
      type: "monthly_summary",
      title: `Summary: ${format(parseISO(prevMonthStart), "MMMM yyyy")}`,
      description: "Review last month's retention and outreach performance.",
      actionHref: "/insights",
      actionLabel: "View insights",
      metadata: { month: prevMonthStart },
    });

    // Return up to 5 most relevant items (prioritise at-risk, visits, touches)
    const priority = ["at_risk", "visits", "touches", "new_clients", "monthly"];
    const rotated = priority
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean)
      .slice(0, 5);

    return NextResponse.json({ items: rotated });
  } catch (error) {
    const { handleApiError } = await import("@/lib/api/response");
    return handleApiError(error, "Dashboard inbox");
  }
}
