import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/campaigns/templates
 * Returns campaign templates available to the user's gym (gym-specific + default).
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

    const { data: userProfile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const { data: templates, error } = await supabase
      .from("campaign_templates")
      .select("id, name, subject, body, channel, template_key, gym_id")
      .or(`gym_id.eq.${userProfile.gym_id},gym_id.is.null`)
      .order("channel")
      .order("name");

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch templates: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates ?? [] });
  } catch (error) {
    console.error("Get campaign templates error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
