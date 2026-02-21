import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET: Returns whether the gym has integration credentials set (never returns the actual keys).
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

    const { data: gym } = await supabase
      .from("gyms")
      .select("resend_api_key, twilio_account_sid, twilio_auth_token, mindbody_api_key, mindbody_site_id, mindbody_access_token, glofox_access_token")
      .eq("id", userProfile.gym_id)
      .single();

    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const g = gym as {
      resend_api_key?: string | null;
      twilio_account_sid?: string | null;
      twilio_auth_token?: string | null;
      mindbody_api_key?: string | null;
      mindbody_site_id?: string | null;
      mindbody_access_token?: string | null;
      glofox_access_token?: string | null;
    };

    return NextResponse.json({
      hasResendKey: Boolean(g.resend_api_key?.trim()),
      hasTwilioCredentials:
        Boolean(g.twilio_account_sid?.trim()) && Boolean(g.twilio_auth_token?.trim()),
      hasMindbodyCredentials:
        Boolean(g.mindbody_api_key?.trim()) && Boolean(g.mindbody_site_id?.trim()) && Boolean(g.mindbody_access_token?.trim()),
      hasGlofoxCredentials: Boolean(g.glofox_access_token?.trim()),
    });
  } catch (error) {
    console.error("Integrations status error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
