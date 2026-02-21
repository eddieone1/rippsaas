import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/guards";

/**
 * GET /api/members/counts
 * Returns counts for status and risk filters (for filter badges).
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    // Fetch all members once and compute counts in memory (simpler; for <2k members fine)
    const { data: members, error } = await supabase
      .from("members")
      .select("status, churn_risk_level, date_of_birth")
      .eq("gym_id", gymId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = members ?? [];
    const thisMonth = new Date().getMonth();

    const counts = {
      all: list.length,
      active: list.filter((m) => m.status === "active").length,
      inactive: list.filter((m) => m.status === "inactive").length,
      cancelled: list.filter((m) => m.status === "cancelled").length,
      high: list.filter((m) => m.churn_risk_level === "high").length,
      medium: list.filter((m) => m.churn_risk_level === "medium").length,
      low: list.filter((m) => m.churn_risk_level === "low").length,
      none: list.filter((m) => m.churn_risk_level === "none" || !m.churn_risk_level).length,
      birthdaysThisMonth: list.filter((m) => {
        const dob = (m as { date_of_birth?: string | null }).date_of_birth;
        if (!dob) return false;
        return new Date(dob).getMonth() === thisMonth;
      }).length,
    };

    return NextResponse.json(counts);
  } catch (err) {
    const { handleApiError } = await import("@/lib/api/response");
    return handleApiError(err, "Members counts");
  }
}
