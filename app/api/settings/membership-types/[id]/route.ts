import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const { name, description, price, billing_frequency, is_active } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Verify membership type belongs to user's gym
    const { data: existingType, error: fetchError } = await supabase
      .from("membership_types")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingType) {
      return NextResponse.json(
        { error: "Membership type not found" },
        { status: 404 }
      );
    }

    if (existingType.gym_id !== userProfile.gym_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: membershipType, error } = await supabase
      .from("membership_types")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        price: price !== null && price !== undefined ? parseFloat(price) : null,
        billing_frequency: billing_frequency || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq("id", id)
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
        { error: `Failed to update membership type: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, membershipType });
  } catch (error) {
    console.error("Update membership type error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // Verify membership type belongs to user's gym
    const { data: existingType, error: fetchError } = await supabase
      .from("membership_types")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingType) {
      return NextResponse.json(
        { error: "Membership type not found" },
        { status: 404 }
      );
    }

    if (existingType.gym_id !== userProfile.gym_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("membership_types")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete membership type: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete membership type error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
