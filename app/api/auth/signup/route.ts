import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { validatePassword } from "@/lib/password-rules";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, clientCount, selectedPlan } = await request.json();

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
      const msg = signUpError.message.toLowerCase();
      const isEmailTaken =
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("user already") ||
        msg.includes("already been registered");
      return NextResponse.json(
        { error: isEmailTaken ? "This email is already being used. Try signing in or use a different email." : signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create or reuse gym — subscription chosen during onboarding (no free trial)
    // selectedPlan (starter_49 | growth_79) is applied during onboarding payment step
    void selectedPlan;

    // Check if gym already exists for this owner_email (handles retries, orphaned gyms)
    const { data: existingGym } = await adminClient
      .from("gyms")
      .select("id, name, subscription_status, trial_ends_at")
      .eq("owner_email", email)
      .maybeSingle();

    let gymData: { id: string } & Record<string, unknown>;

    let gymWasReused = false;
    if (existingGym) {
      gymData = existingGym as typeof gymData;
      gymWasReused = true;
      await adminClient
        .from("gyms")
        .update({
          subscription_status: "canceled",
          trial_ends_at: null,
          ...(clientCount ? { client_count_range: clientCount } : {}),
        })
        .eq("id", existingGym.id);
    } else {
      // Create new gym
      const gymInsert: {
        name: string;
        owner_email: string;
        subscription_status: string;
        trial_ends_at: null;
        client_count_range?: string;
      } = {
        name: "My Gym", // Will be updated in onboarding
        owner_email: email,
        subscription_status: "canceled",
        trial_ends_at: null,
      };

      if (clientCount) {
        gymInsert.client_count_range = clientCount;
      }

      let { data: insertedGym, error: gymError } = await adminClient
        .from("gyms")
        .insert(gymInsert)
        .select()
        .single();

      // If error is due to missing column, retry without client_count_range
      if (gymError && gymError.message.includes("client_count_range")) {
        const { client_count_range, ...gymInsertWithoutClientCount } = gymInsert;
        const retryResult = await adminClient
          .from("gyms")
          .insert(gymInsertWithoutClientCount)
          .select()
          .single();
        insertedGym = retryResult.data;
        gymError = retryResult.error;
      }

      // If duplicate owner_email (race condition), fetch existing gym
      if (gymError && gymError.message.includes("owner_email_key")) {
        const { data: raceGym } = await adminClient
          .from("gyms")
          .select("id")
          .eq("owner_email", email)
          .single();
        if (raceGym) {
          gymData = raceGym as typeof gymData;
          gymWasReused = true;
        } else {
          await supabase.auth.admin.deleteUser(authData.user.id);
          return NextResponse.json(
            { error: `Failed to create gym: ${gymError.message}` },
            { status: 500 }
          );
        }
      } else if (gymError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: `Failed to create gym: ${gymError.message}` },
          { status: 500 }
        );
      } else if (insertedGym) {
        gymData = insertedGym as typeof gymData;
      } else {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create gym" },
          { status: 500 }
        );
      }
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
      // Clean up: delete gym only if we created it (not reused), then delete auth user
      if (!gymWasReused) {
        await adminClient.from("gyms").delete().eq("id", gymData.id);
      }
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
