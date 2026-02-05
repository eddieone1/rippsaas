import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const { name, description, price, billing_frequency, is_active } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data: membershipType, error } = await supabase
      .from("membership_types")
      .insert({
        gym_id: userProfile.gym_id,
        name: name.trim(),
        description: description?.trim() || null,
        price: price !== null && price !== undefined ? parseFloat(price) : null,
        billing_frequency: billing_frequency || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A membership type with this name already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create membership type: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, membershipType });
  } catch (error) {
    console.error("Create membership type error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
