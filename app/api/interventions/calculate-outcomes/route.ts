import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * API endpoint to calculate intervention outcomes
 * MVP-level: Simple attribution based on last intervention before re-engagement
 * 
 * This can be called:
 * - On-demand via button click
 * - Periodically via scheduled job
 * - After new member activities are recorded
 * 
 * MVP Limitation: Attribution is assumed, not proven. Multiple interventions
 * in close proximity may overlap, and we attribute success to the last one sent.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's gym_id
    const { data: userProfile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id) {
      return NextResponse.json(
        { error: "Gym not found" },
        { status: 404 }
      );
    }

    // Get gym's success window configuration
    const { data: gym } = await supabase
      .from("gyms")
      .select("intervention_success_window_days")
      .eq("id", userProfile.gym_id)
      .single();

    const successWindowDays = gym?.intervention_success_window_days || 14;

    // Use admin client to call the function (bypasses RLS if needed)
    const adminClient = createAdminClient();
    
    // Call the database function to calculate outcomes
    const { data, error } = await adminClient.rpc("calculate_intervention_outcomes", {
      p_gym_id: userProfile.gym_id,
      p_success_window_days: successWindowDays,
    });

    if (error) {
      console.error("Error calculating outcomes:", error);
      return NextResponse.json(
        { error: `Failed to calculate outcomes: ${error.message}` },
        { status: 500 }
      );
    }

    const updatedCount = data?.[0]?.updated_count || 0;

    return NextResponse.json({
      success: true,
      updated_count: updatedCount,
      message: `Calculated outcomes for ${updatedCount} intervention(s)`,
    });
  } catch (error) {
    console.error("Calculate outcomes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
