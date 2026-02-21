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

    const {
      gymName,
      ownerName,
      phone,
      address_line1,
      address_line2,
      city,
      postcode,
      country,
      latitude,
      longitude,
    } = await request.json();

    if (!gymName || !ownerName) {
      return NextResponse.json(
        { error: "Gym name and owner name are required" },
        { status: 400 }
      );
    }

    if (!address_line1 || !city || !postcode) {
      return NextResponse.json(
        { error: "Gym address (address line 1, city, and postcode) are required" },
        { status: 400 }
      );
    }

    // Get user's gym_id - use admin client to bypass RLS
    const { data: userProfile } = await adminClient
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    let gymId = userProfile?.gym_id;

    // If user doesn't have a gym_id, create one (edge case - should have been created during signup)
    if (!gymId) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

      const { data: newGym, error: createGymError } = await adminClient
        .from("gyms")
        .insert({
          name: "My Gym", // Will be updated below
          owner_email: user.email || "",
          subscription_status: "trialing",
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select()
        .single();

      if (createGymError || !newGym) {
        return NextResponse.json(
          { error: `Failed to create gym: ${createGymError?.message || "Unknown error"}` },
          { status: 500 }
        );
      }

      gymId = newGym.id;

      // Update user profile with gym_id
      const { error: updateUserError } = await adminClient
        .from("users")
        .update({ gym_id: gymId })
        .eq("id", user.id);

      if (updateUserError) {
        return NextResponse.json(
          { error: `Failed to link gym to user: ${updateUserError.message}` },
          { status: 500 }
        );
      }
    }

    // Update gym with address information
    const gymUpdate: {
      name: string;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      postcode?: string | null;
      country?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    } = {
      name: gymName,
      address_line1: address_line1 || null,
      address_line2: address_line2 || null,
      city: city || null,
      postcode: postcode || null,
      country: country || "UK",
      latitude: latitude || null,
      longitude: longitude || null,
    };

    const { error: gymError } = await adminClient
      .from("gyms")
      .update(gymUpdate)
      .eq("id", gymId);

    if (gymError) {
      return NextResponse.json(
        { error: `Failed to update gym: ${gymError.message}` },
        { status: 500 }
      );
    }

    // Update user profile - use admin client to bypass RLS
    const { error: userError } = await adminClient
      .from("users")
      .update({
        full_name: ownerName,
      })
      .eq("id", user.id);

    if (userError) {
      return NextResponse.json(
        { error: `Failed to update user profile: ${userError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gym info update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
