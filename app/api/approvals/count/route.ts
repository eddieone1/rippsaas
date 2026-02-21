import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";

/**
 * GET /api/approvals/count
 * Returns the number of interventions pending approval for the current gym.
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const tenantId = gymId ?? process.env.INTERVENTIONS_DEMO_TENANT_ID ?? "demo-tenant";

    const admin = createAdminClient();
    const { count, error } = await admin
      .from("intervention_interventions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "PENDING_APPROVAL");

    if (error) {
      console.error("Approvals count error:", error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
