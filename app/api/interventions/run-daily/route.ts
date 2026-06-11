import { NextResponse } from "next/server";
import { runDailyForTenant } from "@/lib/interventions/engine";
import { requireApiAuth } from "@/lib/auth/guards";

export const maxDuration = 60;

/**
 * Manual trigger for intervention daily run. Uses authenticated user's gymId.
 * For scheduled runs, use /api/cron/interventions instead.
 */
export async function POST() {
  try {
    const { gymId } = await requireApiAuth();
    const result = await runDailyForTenant(gymId, { forceApproval: true });
    return NextResponse.json(result);
  } catch (e) {
    if (e && typeof e === "object" && "status" in e) {
      const err = e as { message?: string; status: number };
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: err.status });
    }
    if (e && typeof e === "object" && "issues" in e) {
      return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
    }
    console.error("Run daily", e);
    return NextResponse.json({ error: "Daily run failed" }, { status: 500 });
  }
}
