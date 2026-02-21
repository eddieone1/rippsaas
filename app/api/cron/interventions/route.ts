import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDailyForTenant } from "@/lib/interventions/engine";

export const maxDuration = 60;

/**
 * POST /api/cron/interventions
 *
 * Daily cron job (9 AM). Checks which gyms have auto-interventions enabled,
 * then runs the intervention engine for each with forceApproval so every
 * generated intervention lands in the approval queue before being sent.
 */
export async function POST() {
  try {
    const admin = createAdminClient();

    // Find all gyms with auto-interventions enabled
    const { data: gyms, error } = await admin
      .from("gyms")
      .select("id, name")
      .eq("auto_interventions_enabled", true);

    if (error) {
      console.error("Cron interventions: failed to fetch gyms", error);
      return NextResponse.json(
        { error: "Failed to fetch gyms" },
        { status: 500 }
      );
    }

    if (!gyms || gyms.length === 0) {
      return NextResponse.json({
        message: "No gyms have auto-interventions enabled",
        results: [],
      });
    }

    // Run the engine for each gym (using default tenant mapping for now)
    const tenantId =
      process.env.INTERVENTIONS_DEMO_TENANT_ID ?? "demo-tenant";

    const results = [];
    for (const gym of gyms) {
      try {
        const result = await runDailyForTenant(tenantId, {
          forceApproval: true,
        });
        results.push({
          gymId: gym.id,
          gymName: gym.name,
          ...result,
        });
      } catch (e) {
        console.error(
          `Cron interventions: failed for gym ${gym.id}`,
          e
        );
        results.push({
          gymId: gym.id,
          gymName: gym.name,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Cron interventions error:", e);
    return NextResponse.json(
      { error: "Daily intervention run failed" },
      { status: 500 }
    );
  }
}
