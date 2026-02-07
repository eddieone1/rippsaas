import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings/staff
 * List coaches (and owner) for the current gym. Owner only.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: myProfile } = await supabase
      .from("users")
      .select("gym_id, role")
      .eq("id", user.id)
      .single();

    if (!myProfile?.gym_id) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    if (myProfile.role !== "owner") {
      return NextResponse.json({ error: "Only owners can view staff" }, { status: 403 });
    }

    const { data: staff } = await supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .eq("gym_id", myProfile.gym_id)
      .order("role", { ascending: false })
      .order("full_name");

    return NextResponse.json({ staff: staff ?? [] });
  } catch (error) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
