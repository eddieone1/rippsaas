import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";

/**
 * POST /api/user/record-login
 *
 * Called after successful login to:
 * 1. Update last_login_at on users
 * 2. Store current dashboard metrics as baseline for stat card deltas
 */
export async function POST() {
  try {
    let auth: Awaited<ReturnType<typeof requireApiAuth>>;
    try {
      auth = await requireApiAuth();
    } catch {
      // User may not have gym yet (onboarding) - still succeed
      return NextResponse.json({ ok: true });
    }
    const { userProfile, gymId } = auth;
    const userId = userProfile.id;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const now = new Date().toISOString();

    // 1. Update last_login_at (users table may be in public schema; use admin if RLS blocks)
    await adminClient
      .from("users")
      .update({ last_login_at: now } as Record<string, unknown>)
      .eq("id", userId);

    // 2. Fetch current metrics (same logic as dashboard)
    const { data: members } = await supabase
      .from("members")
      .select("id, membership_type_id, churn_risk_level, churn_risk_score, commitment_score")
      .eq("gym_id", gymId)
      .eq("status", "active");

    if (!members || members.length === 0) {
      await adminClient.from("user_metric_snapshots").insert({
        user_id: userId,
        at_risk_count: 0,
        avg_commitment_score: 0,
        revenue_at_risk: 0,
        revenue_saved: 0,
      });
      return NextResponse.json({ ok: true });
    }

    const atRiskCount = members.filter(
      (m) => m.churn_risk_level === "high" || m.churn_risk_level === "medium"
    ).length;

    const { data: membershipTypes } = await supabase
      .from("membership_types")
      .select("id, price, billing_frequency")
      .eq("gym_id", gymId)
      .eq("is_active", true);

    const membershipTypeMap = new Map(membershipTypes?.map((mt) => [mt.id, mt]) || []);

    const getMonthlyRevenue = (member: { membership_type_id?: string | null }): number => {
      if (!member.membership_type_id) return 30;
      const mt = membershipTypeMap.get(member.membership_type_id);
      if (!mt?.price) return 30;
      const price = Number(mt.price);
      switch (mt.billing_frequency) {
        case "quarterly":
          return price / 3;
        case "yearly":
          return price / 12;
        default:
          return price;
      }
    };

    const atRiskMembers = members.filter(
      (m) => m.churn_risk_level === "high" || m.churn_risk_level === "medium"
    );
    const revenueAtRisk = Math.round(
      atRiskMembers.reduce((sum, m) => sum + getMonthlyRevenue(m), 0)
    );

    const commitmentScores = members
      .map((m) => (m as { commitment_score?: number | null }).commitment_score)
      .filter((s): s is number => typeof s === "number" && s >= 0 && s <= 100);
    const avgCommitmentScore =
      commitmentScores.length > 0
        ? Math.round(
            commitmentScores.reduce((a, b) => a + b, 0) / commitmentScores.length
          )
        : 0;

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("gym_id", gymId);
    const campaignIds = campaigns?.map((c) => c.id) || [];

    let revenueSaved = 0;
    if (campaignIds.length > 0) {
      const { data: reEngaged } = await supabase
        .from("campaign_sends")
        .select("member_id")
        .in("campaign_id", campaignIds)
        .eq("member_re_engaged", true)
        .gte("sent_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      const reEngagedIds = new Set(reEngaged?.map((s) => s.member_id) || []);
      revenueSaved = Math.round(
        members
          .filter((m) => reEngagedIds.has(m.id))
          .reduce((sum, m) => sum + getMonthlyRevenue(m), 0)
      );
    }

    // Insert snapshot (use admin to bypass RLS if needed – user_metric_snapshots allows INSERT with user_id = auth.uid())
    await supabase.from("user_metric_snapshots").insert({
      user_id: userId,
      at_risk_count: atRiskCount,
      avg_commitment_score: avgCommitmentScore,
      revenue_at_risk: revenueAtRisk,
      revenue_saved: revenueSaved,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Record login error:", e);
    return NextResponse.json({ error: "Failed to record login" }, { status: 500 });
  }
}
