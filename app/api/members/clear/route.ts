import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/members/clear
 * Deletes all members for the authenticated user's gym (cascades to activities, etc.)
 */
export async function POST() {
  try {
    const { gymId } = await requireAuth();
    const supabase = await createClient();

    const { data: deleted, error } = await supabase
      .from("members")
      .delete()
      .eq("gym_id", gymId)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to clear members" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: deleted?.length ?? 0,
    });
  } catch (err) {
    console.error("Clear members error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
