import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient(); // Use admin client to bypass RLS
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's gym_id - use admin client to bypass RLS
    const { data: userProfile } = await adminClient
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

    // Ensure trial is set (it should already be set, but ensure it's active)
    // Use admin client to bypass RLS
    const { error: gymError } = await adminClient
      .from("gyms")
      .update({
        subscription_status: "trialing",
      })
      .eq("id", userProfile.gym_id);

    if (gymError) {
      return NextResponse.json(
        { error: `Failed to start trial: ${gymError.message}` },
        { status: 500 }
      );
    }

    // In MVP, we skip Stripe Checkout - trial is already active
    // In production, this would create a Stripe Checkout session

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment setup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
