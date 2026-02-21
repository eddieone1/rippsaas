import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { validatePassword } from "@/lib/password-rules";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, clientCount } = await request.json();

    if (!email || !password || !fullName || !clientCount) {
      return NextResponse.json(
        { error: "Email, password, full name, and client count are required" },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message ?? "Password does not meet requirements" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient(); // Use admin client to bypass RLS

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create gym (with trial status) - use admin client to bypass RLS
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    // First, try to insert with client_count_range
    let gymInsert: {
      name: string;
      owner_email: string;
      subscription_status: string;
      trial_ends_at: string;
      client_count_range?: string;
    } = {
      name: "My Gym", // Will be updated in onboarding
      owner_email: email,
      subscription_status: "trialing",
      trial_ends_at: trialEndsAt.toISOString(),
    };

    // Add client_count_range if provided
    if (clientCount) {
      gymInsert.client_count_range = clientCount;
    }

    let { data: gymData, error: gymError } = await adminClient
      .from("gyms")
      .insert(gymInsert)
      .select()
      .single();

    // If error is due to missing column, retry without client_count_range
    if (gymError && gymError.message.includes("client_count_range")) {
      console.warn("client_count_range column not found, creating gym without it. Migration 006 needs to be applied.");
      // Retry without client_count_range
      const { client_count_range, ...gymInsertWithoutClientCount } = gymInsert;
      const retryResult = await adminClient
        .from("gyms")
        .insert(gymInsertWithoutClientCount)
        .select()
        .single();
      
      gymData = retryResult.data;
      gymError = retryResult.error;
      
      if (gymError) {
        return NextResponse.json(
          { 
            error: `Failed to create gym: ${gymError.message}`,
            note: "Note: Migration 006_add_client_count_range.sql should be applied to store client count data."
          },
          { status: 500 }
        );
      }
    }

    if (gymError) {
      // Clean up: delete the auth user if gym creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Failed to create gym: ${gymError.message}` },
        { status: 500 }
      );
    }

    // Create user profile - use admin client to bypass RLS
    const { error: userError } = await adminClient.from("users").insert({
      id: authData.user.id,
      gym_id: gymData.id,
      email: email,
      full_name: fullName,
      role: "owner",
    });

    if (userError) {
      // Clean up: delete gym and auth user if user profile creation fails
      await adminClient.from("gyms").delete().eq("id", gymData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Failed to create user profile: ${userError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      gym: gymData,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
