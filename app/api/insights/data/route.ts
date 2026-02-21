import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCommitmentScore } from "@/lib/commitment-score";
import { calculateChurnRisk } from "@/lib/churn-risk";
import { getMemberStage } from "@/lib/member-intelligence";
import { differenceInDays, parseISO, subDays } from "date-fns";
import type { Member as InsightsMember, Campaign as InsightsCampaign } from "@/components/insights/insights-types";
import type { ReasonLabel } from "@/components/insights/insights-types";

/** Map lib member-intelligence stage to Insights page stage */
const LIB_STAGE_TO_INSIGHTS: Record<string, InsightsMember["stage"]> = {
  onboarding_vulnerability: "onboarding",
  habit_formation: "forming",
  momentum_identity: "stable",
  plateau_boredom_risk: "plateau",
  emotional_disengagement: "at_risk",
  at_risk_silent_quit: "at_risk",
  win_back_window: "winback",
  churned: "churned",
};

function getReasonsFromMember(
  m: { last_visit_date: string | null; churn_risk_level: string }
): ReasonLabel[] {
  const reasons: ReasonLabel[] = [];
  if (!m.last_visit_date) reasons.push("No Bookings");
  const daysSince = m.last_visit_date
    ? differenceInDays(new Date(), parseISO(m.last_visit_date))
    : 999;
  if (daysSince > 14) reasons.push("Attendance Drop");
  if (m.churn_risk_level === "high" && !reasons.includes("Attendance Drop"))
    reasons.push("Plateau");
  return reasons;
}

/**
 * GET /api/insights/data
 * Returns members in Insights page shape (real data from DB).
 */
export async function GET() {
  try {
    const { gymId } = await requireAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: rows } = await supabase
      .from("members")
      .select("id, first_name, last_name, joined_date, last_visit_date, churn_risk_score, churn_risk_level, status, membership_type_id, commitment_score")
      .eq("gym_id", gymId)
      .order("churn_risk_score", { ascending: false });

    const members: InsightsMember[] = [];
    if (rows && rows.length > 0) {

    const { data: membershipTypes } = await supabase
      .from("membership_types")
      .select("id, name, price, billing_frequency")
      .eq("gym_id", gymId)
      .eq("is_active", true);

    const mtMap = new Map((membershipTypes ?? []).map((mt) => [mt.id, mt]));

    const memberIds = rows.map((r) => r.id);
    const { data: activities } = await adminClient
      .from("member_activities")
      .select("member_id, activity_date")
      .eq("activity_type", "visit")
      .in("member_id", memberIds)
      .order("activity_date", { ascending: false });

    const visitDatesByMember = new Map<string, string[]>();
    activities?.forEach((a) => {
      if (!visitDatesByMember.has(a.member_id)) visitDatesByMember.set(a.member_id, []);
      visitDatesByMember.get(a.member_id)!.push(a.activity_date);
    });

    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().slice(0, 10);
    for (const m of rows) {
      const visitDates = visitDatesByMember.get(m.id) ?? [];
      const visitsLast30Days = visitDates.filter((d) => (d || "").slice(0, 10) >= thirtyDaysAgo).length;
      const commitmentScore =
        typeof (m as { commitment_score?: number | null }).commitment_score === "number"
          ? (m as { commitment_score: number }).commitment_score
          : calculateCommitmentScore({
              joinedDate: m.joined_date,
              lastVisitDate: m.last_visit_date,
              visitDates,
              expectedVisitsPerWeek: 2,
            }).score;
      const churnResult = calculateChurnRisk({
        last_visit_date: m.last_visit_date,
        joined_date: m.joined_date,
        commitment_score: commitmentScore,
        visits_last_30_days: visitsLast30Days,
      });
      const daysSinceJoined = differenceInDays(new Date(), parseISO(m.joined_date));
      const daysSinceLastVisit = m.last_visit_date
        ? differenceInDays(new Date(), parseISO(m.last_visit_date))
        : null;
      const libStage = getMemberStage({
        status: m.status,
        churnRiskScore: churnResult.score,
        churnRiskLevel: churnResult.level,
        commitmentScore,
        daysSinceJoined,
        daysSinceLastVisit,
        visitsLast30Days,
      });
      const stage = LIB_STAGE_TO_INSIGHTS[libStage] ?? "stable";
      const mt = m.membership_type_id ? mtMap.get(m.membership_type_id) : null;
      let mrr = 0;
      if (mt?.price != null) {
        const price = Number(mt.price);
        switch (mt.billing_frequency) {
          case "monthly":
            mrr = price;
            break;
          case "quarterly":
            mrr = price / 3;
            break;
          case "yearly":
            mrr = price / 12;
            break;
          default:
            mrr = price;
        }
      }
      if (mrr === 0) mrr = 30;
      members.push({
        id: m.id,
        name: [m.first_name, m.last_name].filter(Boolean).join(" ") || "Unknown",
        plan: mt?.name ?? "Member",
        location: "Main",
        stage,
        churnRiskScore: churnResult.score,
        healthScore: Math.round(commitmentScore),
        lastTouchAt: m.last_visit_date,
        reasons: getReasonsFromMember(m),
        mrr,
        status: m.status,
      });
    }
    }

    // Real campaign data from campaigns + campaign_sends
    const { data: campaignRows } = await supabase
      .from("campaigns")
      .select("id, name, channel, trigger_days, created_at")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    const campaigns: InsightsCampaign[] = [];
    if (campaignRows && campaignRows.length > 0) {
      const campaignIds = campaignRows.map((c) => c.id);
      const { data: sends } = await adminClient
        .from("campaign_sends")
        .select("campaign_id, member_id, member_re_engaged")
        .in("campaign_id", campaignIds);

      const memberMrrMap = new Map<string, number>(members.map((m) => [m.id, m.mrr]));

      const sendsByCampaign = new Map<string, { reached: Set<string>; reEngaged: number }>();
      (sends ?? []).forEach((s) => {
        if (!sendsByCampaign.has(s.campaign_id)) {
          sendsByCampaign.set(s.campaign_id, { reached: new Set(), reEngaged: 0 });
        }
        const agg = sendsByCampaign.get(s.campaign_id)!;
        agg.reached.add(s.member_id);
        if (s.member_re_engaged) agg.reEngaged += 1;
      });

      campaignRows.forEach((c) => {
        const agg = sendsByCampaign.get(c.id) ?? { reached: new Set<string>(), reEngaged: 0 };
        const membersReached = agg.reached.size;
        const membersSaved = agg.reEngaged;
        const responseRate = membersReached > 0
          ? Math.round((membersSaved / membersReached) * 100)
          : 0;
        let recoveredRevenue = 0;
        if (membersSaved > 0 && sends) {
          const reEngagedFromCampaign = sends
            .filter((s) => s.campaign_id === c.id && s.member_re_engaged)
            .map((s) => s.member_id);
          reEngagedFromCampaign.forEach((mid) => {
            recoveredRevenue += memberMrrMap.get(mid) ?? 0;
          });
        }
        const created = c.created_at ? new Date(c.created_at) : new Date();
        const endDate = new Date(created);
        endDate.setDate(endDate.getDate() + 14);
        campaigns.push({
          id: c.id,
          name: c.name,
          startDate: created.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          channel: c.channel === "sms" ? "SMS" : "Email",
          membersReached,
          responseRate,
          membersSaved,
          recoveredRevenue,
        });
      });
    }

    return NextResponse.json({ members, campaigns });
  } catch (e) {
    console.error("[insights/data]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load insights data" },
      { status: 500 }
    );
  }
}
