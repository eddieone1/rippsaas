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

    const { userId } = await request.json();

    // Verify the userId matches the authenticated user (or just use auth user id)
    const targetUserId = userId || user.id;

    // Update user profile to mark tour as completed
    const { error } = await supabase
      .from("users")
      .update({ has_completed_tour: true })
      .eq("id", targetUserId);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update tour status: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark tour complete error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
