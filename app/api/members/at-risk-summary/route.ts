import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";

/**
 * GET /api/members/at-risk-summary
 * Lightweight summary for Members page hero: atRiskCount, revenueAtRisk
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { data: members } = await supabase
      .from("members")
      .select("id, membership_type_id")
      .eq("gym_id", gymId)
      .eq("status", "active")
      .in("churn_risk_level", ["high", "medium", "low"]);

    const atRiskCount = members?.length ?? 0;

    if (atRiskCount === 0) {
      return NextResponse.json({ atRiskCount: 0, revenueAtRisk: 0 });
    }

    const { data: membershipTypes } = await supabase
      .from("membership_types")
      .select("id, price, billing_frequency")
      .eq("gym_id", gymId)
      .eq("is_active", true);

    const mtMap = new Map(
      membershipTypes?.map((mt) => [mt.id, mt]) ?? []
    );

    const getMonthlyRevenue = (member: { membership_type_id?: string | null }) => {
      if (!member.membership_type_id) return 30;
      const mt = mtMap.get(member.membership_type_id);
      if (!mt?.price) return 30;
      const price = Number(mt.price);
      switch (mt.billing_frequency) {
        case "monthly": return price;
        case "quarterly": return price / 3;
        case "yearly": return price / 12;
        default: return price;
      }
    };

    const revenueAtRisk = members!.reduce(
      (sum, m) => sum + getMonthlyRevenue(m),
      0
    );

    return NextResponse.json({
      atRiskCount,
      revenueAtRisk: Math.round(revenueAtRisk),
    });
  } catch (err) {
    const { handleApiError } = await import("@/lib/api/response");
    return handleApiError(err, "At-risk summary");
  }
}
