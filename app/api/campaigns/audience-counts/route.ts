import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import { NextResponse } from "next/server";

/**
 * GET /api/campaigns/audience-counts
 * Returns audience counts for multiple trigger_days (for quick send buttons).
 * Query: trigger_days=14,21,30,60 (comma-separated)
 */
export async function GET(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const triggerDaysParam = searchParams.get("trigger_days") ?? "14,21,30,60";
    const triggerDays = triggerDaysParam
      .split(",")
      .map((s) => Math.min(365, Math.max(1, parseInt(s.trim(), 10) || 14)))
      .filter((v, i, a) => a.indexOf(v) === i);

    const channel = searchParams.get("channel") ?? "email";
    const includeCancelled = searchParams.get("include_cancelled") === "true";

    const counts: Record<string, number> = {};

    for (const td of triggerDays) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - td);

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

      query = query.or("churn_risk_level.eq.low,churn_risk_level.eq.medium,churn_risk_level.eq.high");

      if (channel === "email") {
        query = query.not("email", "is", null);
      } else if (channel === "sms") {
        query = query.not("phone", "is", null);
      }

      const { count } = await query;
      counts[String(td)] = count ?? 0;
    }

    return NextResponse.json({ counts });
  } catch (e) {
    console.error("Audience counts error:", e);
    return NextResponse.json({ counts: {} });
  }
}
