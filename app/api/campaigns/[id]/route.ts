import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/campaigns/[id]
 * Returns campaign detail with template and performance/insights (sends, outcomes, success rate).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
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

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        `
        id,
        name,
        trigger_type,
        trigger_days,
        channel,
        status,
        created_at,
        template_id,
        campaign_templates (
          id,
          name,
          subject,
          body,
          channel
        )
      `
      )
      .eq("id", campaignId)
      .eq("gym_id", userProfile.gym_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const { data: sends } = await supabase
      .from("campaign_sends")
      .select("id, sent_at, outcome, days_to_return, member_id")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false });

    const totalSent = sends?.length ?? 0;
    const reEngaged = sends?.filter((s) => s.outcome === "re_engaged").length ?? 0;
    const noResponse = sends?.filter((s) => s.outcome === "no_response").length ?? 0;
    const cancelled = sends?.filter((s) => s.outcome === "cancelled").length ?? 0;
    const pending = sends?.filter((s) => !s.outcome).length ?? 0;
    const daysToReturn = (sends ?? [])
      .filter((s) => s.days_to_return != null)
      .map((s) => s.days_to_return as number);
    const avgDaysToReturn =
      daysToReturn.length > 0
        ? Math.round(
            daysToReturn.reduce((a, b) => a + b, 0) / daysToReturn.length
          )
        : null;
    const successRate =
      totalSent > 0 ? Math.round((reEngaged / totalSent) * 100) : 0;

    return NextResponse.json({
      campaign: {
        ...campaign,
        target_segment: (campaign as Record<string, unknown>)?.target_segment ?? "all",
        include_cancelled: Boolean((campaign as Record<string, unknown>)?.include_cancelled),
        campaign_templates: Array.isArray(campaign.campaign_templates)
          ? campaign.campaign_templates[0]
          : campaign.campaign_templates,
      },
      insights: {
        total_sent: totalSent,
        re_engaged: reEngaged,
        no_response: noResponse,
        cancelled,
        pending,
        success_rate: successRate,
        avg_days_to_return: avgDaysToReturn,
      },
      recent_sends: sends?.slice(0, 20) ?? [],
    });
  } catch (error) {
    console.error("Get campaign detail error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
