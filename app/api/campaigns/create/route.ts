import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      gym_id,
      name,
      channel,
      trigger_days,
      message_type,
      template_id,
      custom_subject,
      custom_body,
      target_segment = "all",
      include_cancelled = false,
    } = await request.json();

    if (!name || !channel || !trigger_days) {
      return NextResponse.json(
        { error: "Campaign name, channel, and trigger days are required" },
        { status: 400 }
      );
    }

    // Get user's gym_id to verify ownership
    const { data: userProfile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id || userProfile.gym_id !== gym_id) {
      return NextResponse.json(
        { error: "Unauthorized or gym not found" },
        { status: 403 }
      );
    }

    let finalTemplateId = template_id;

    // If custom message, create a template first
    if (message_type === "custom") {
      if (!custom_subject || !custom_body) {
        return NextResponse.json(
          { error: "Custom subject and body are required for custom messages" },
          { status: 400 }
        );
      }

      // Create a new template for this custom message
      const { data: newTemplate, error: templateError } = await adminClient
        .from("campaign_templates")
        .insert({
          gym_id: gym_id,
          name: `${name} Template`,
          subject: custom_subject,
          body: custom_body,
          channel: channel,
        })
        .select()
        .single();

      if (templateError || !newTemplate) {
        return NextResponse.json(
          { error: `Failed to create template: ${templateError?.message}` },
          { status: 500 }
        );
      }

      finalTemplateId = newTemplate.id;
    } else {
      // If template, verify it exists and is accessible
      if (!template_id) {
        return NextResponse.json(
          { error: "Template ID is required when using template message type" },
          { status: 400 }
        );
      }

      const { data: template } = await adminClient
        .from("campaign_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (!template || (template.gym_id !== null && template.gym_id !== gym_id)) {
        return NextResponse.json(
          { error: "Template not found or not accessible" },
          { status: 404 }
        );
      }

      finalTemplateId = template_id; // Use the provided template ID
    }

    const segment = ["low", "medium", "high", "all"].includes(target_segment)
      ? target_segment
      : "all";

    // Create the campaign
    const { data: campaign, error: campaignError } = await adminClient
      .from("campaigns")
      .insert({
        gym_id: gym_id,
        name: name,
        trigger_type: "inactivity_threshold",
        trigger_days: trigger_days,
        channel: channel,
        template_id: finalTemplateId,
        status: "active",
        target_segment: segment,
        include_cancelled: Boolean(include_cancelled),
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: `Failed to create campaign: ${campaignError?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: campaign,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
