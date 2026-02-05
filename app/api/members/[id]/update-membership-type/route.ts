import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
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
    const memberId = resolvedParams.id;

    const { membership_type_id } = await request.json();

    // Verify member belongs to user's gym
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("gym_id")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    if (member.gym_id !== userProfile.gym_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // If membership_type_id is provided, verify it belongs to the gym
    if (membership_type_id) {
      const { data: membershipType, error: typeError } = await supabase
        .from("membership_types")
        .select("gym_id")
        .eq("id", membership_type_id)
        .single();

      if (typeError || !membershipType) {
        return NextResponse.json(
          { error: "Membership type not found" },
          { status: 404 }
        );
      }

      if (membershipType.gym_id !== userProfile.gym_id) {
        return NextResponse.json(
          { error: "Unauthorized: membership type does not belong to your gym" },
          { status: 403 }
        );
      }
    }

    // Update member's membership type
    const { error: updateError } = await supabase
      .from("members")
      .update({ membership_type_id: membership_type_id || null })
      .eq("id", memberId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update membership type: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update membership type error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
