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

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;

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

    // Verify member belongs to user's gym
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("id", memberId)
      .eq("gym_id", userProfile.gym_id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Update member to mark as re-engaged
    // This would typically update the most recent campaign_send record
    const { data: latestCampaignSend } = await supabase
      .from("campaign_sends")
      .select("id")
      .eq("member_id", memberId)
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    if (latestCampaignSend) {
      await supabase
        .from("campaign_sends")
        .update({ member_re_engaged: true })
        .eq("id", latestCampaignSend.id);
    }

    // Update member status to active if inactive
    await supabase
      .from("members")
      .update({ status: "active" })
      .eq("id", memberId);

    // Trigger outcome calculation for interventions (background, non-blocking)
    // MVP: Fire and forget - outcomes will be recalculated when user views insights
    fetch("/api/interventions/calculate-outcomes", {
      method: "POST",
    }).catch((err) => {
      console.error("Failed to trigger outcome calculation:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark re-engaged error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
