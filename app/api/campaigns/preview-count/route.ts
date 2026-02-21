import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import { NextResponse } from "next/server";

/**
 * GET /api/campaigns/preview-count
 * Returns count of members matching the campaign criteria (for RunCampaignModal audience preview).
 */
export async function GET(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const triggerDays = Math.min(365, Math.max(1, parseInt(searchParams.get("trigger_days") ?? "14", 10) || 14));
    const channel = searchParams.get("channel") ?? "email";
    const targetSegment = searchParams.get("target_segment") ?? "all";
    const includeCancelled = searchParams.get("include_cancelled") === "true";

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - triggerDays);

    let query = supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .lte("last_visit_date", thresholdDate.toISOString().split("T")[0]);

    if (includeCancelled) {
      query = query.or("status.eq.active,status.eq.cancelled");
    } else {
      query = query.eq("status", "active");
    }

    if (targetSegment !== "all") {
      query = query.eq("churn_risk_level", targetSegment);
    } else {
      query = query.or("churn_risk_level.eq.low,churn_risk_level.eq.medium,churn_risk_level.eq.high");
    }

    if (channel === "email") {
      query = query.not("email", "is", null);
    } else if (channel === "sms") {
      query = query.not("phone", "is", null);
    }

    const { count } = await query;

    return NextResponse.json({ count: count ?? 0 });
  } catch (e) {
    console.error("Preview count error:", e);
    return NextResponse.json({ count: 0 });
  }
}
