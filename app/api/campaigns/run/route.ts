import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, replaceTemplateVariables, createBrandedEmailTemplate } from "@/lib/email/resend";
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
      triggerDays,
      channel = "email",
      message_type = "template",
      template_id,
      custom_subject,
      custom_body,
      target_segment = "all",
      include_cancelled = false,
    } = await request.json();

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

    // Get gym info with branding
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, logo_url, brand_primary_color, brand_secondary_color")
      .eq("id", userProfile.gym_id)
      .single();

    if (!gym) {
      return NextResponse.json(
        { error: "Gym not found" },
        { status: 404 }
      );
    }

    // Get at-risk members for this threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - (triggerDays || 14));

    const segment = ["low", "medium", "high", "all"].includes(target_segment)
      ? target_segment
      : "all";
    const includeCancelled = Boolean(include_cancelled);

    // Build member query: status (active, or active + cancelled if include_cancelled)
    let memberQuery = supabase
      .from("members")
      .select("*")
      .eq("gym_id", userProfile.gym_id)
      .lte("last_visit_date", thresholdDate.toISOString().split("T")[0]);

    if (includeCancelled) {
      memberQuery = memberQuery.or("status.eq.active,status.eq.cancelled");
    } else {
      memberQuery = memberQuery.eq("status", "active");
    }

    if (segment !== "all") {
      memberQuery = memberQuery.eq("churn_risk_level", segment);
    } else {
      memberQuery = memberQuery.or(
        "churn_risk_level.eq.low,churn_risk_level.eq.medium,churn_risk_level.eq.high"
      );
    }

    if (channel === "email") {
      memberQuery = memberQuery.not("email", "is", null);
    } else if (channel === "sms") {
      memberQuery = memberQuery.not("phone", "is", null);
    }

    const { data: atRiskMembers } = await memberQuery.limit(100);

    if (!atRiskMembers || atRiskMembers.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: `No members at risk for this threshold with ${channel === "email" ? "email" : "phone"} contact`,
      });
    }

    // Get template or create one from custom message
    let campaignTemplate;
    let finalTemplateId;

    if (message_type === "custom") {
      if (!custom_subject || !custom_body) {
        return NextResponse.json(
          { error: "Custom subject and body are required for custom messages" },
          { status: 400 }
        );
      }

      // Create a temporary template for this custom message
      const { data: newTemplate, error: templateError } = await adminClient
        .from("campaign_templates")
        .insert({
          gym_id: userProfile.gym_id,
          name: `${triggerDays} Days Inactive - Custom`,
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

      campaignTemplate = newTemplate;
      finalTemplateId = newTemplate.id;
    } else {
      // Use provided template
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

      if (!template || (template.gym_id !== null && template.gym_id !== userProfile.gym_id)) {
        return NextResponse.json(
          { error: "Template not found or not accessible" },
          { status: 404 }
        );
      }

      campaignTemplate = template;
      finalTemplateId = template_id;
    }

    // Get or create campaign
    let { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("gym_id", userProfile.gym_id)
      .eq("trigger_days", triggerDays)
      .eq("channel", channel)
      .eq("status", "active")
      .maybeSingle();

    if (!campaign) {
      const { data: newCampaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          gym_id: userProfile.gym_id,
          name: `${triggerDays} Days Inactive - ${channel === "email" ? "Email" : "SMS"}`,
          trigger_type: "inactivity_threshold",
          trigger_days: triggerDays,
          channel: channel,
          template_id: finalTemplateId,
          status: "active",
          target_segment: segment,
          include_cancelled: includeCancelled,
        })
        .select()
        .single();

      if (campaignError || !newCampaign) {
        return NextResponse.json(
          { error: `Failed to create campaign: ${campaignError?.message}` },
          { status: 500 }
        );
      }

      campaign = newCampaign;
    }

    // Send messages to at-risk members
    let sentCount = 0;
    const errors: string[] = [];

    for (const member of atRiskMembers) {
      // Check contact method based on channel
      if (channel === "email" && !member.email) continue;
      if (channel === "sms" && !member.phone) continue;

      // Check if we've already sent to this member recently (within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentSend } = await supabase
        .from("campaign_sends")
        .select("id")
        .eq("member_id", member.id)
        .eq("campaign_id", campaign.id)
        .gte("sent_at", sevenDaysAgo.toISOString())
        .maybeSingle();

      if (recentSend) {
        continue; // Skip if already sent recently
      }

      // Replace template variables
      const messageBodyPlain = replaceTemplateVariables(campaignTemplate.body, {
        first_name: member.first_name,
        gym_name: gym.name,
        last_visit_date: member.last_visit_date
          ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
          : "recently",
      });

      const messageSubject = replaceTemplateVariables(campaignTemplate.subject, {
        gym_name: gym.name,
        first_name: member.first_name,
      });

      let externalId: string | null = null;
      let sendError: string | null = null;
      let sendStatus: "sent" | "failed" = "sent";

      if (channel === "email") {
        // Create branded email template
        const messageBody = createBrandedEmailTemplate(messageBodyPlain, {
          logo_url: gym?.logo_url,
          brand_primary_color: gym?.brand_primary_color,
          brand_secondary_color: gym?.brand_secondary_color,
          gym_name: gym.name,
        });

        // Send email
        const { id: emailId, error: emailError } = await sendEmail({
          to: member.email!,
          subject: messageSubject,
          body: messageBody,
        });

        externalId = emailId;
        sendError = emailError ? String(emailError) : null;
        sendStatus = emailError ? "failed" : "sent";
      } else if (channel === "sms") {
        // TODO: Implement SMS sending when SMS provider is integrated
        // For now, we'll just log and mark as sent
        console.log(`SMS would be sent to ${member.phone}: ${messageSubject} - ${messageBodyPlain}`);
        sendStatus = "sent";
      }

      // Record campaign send
      await supabase.from("campaign_sends").insert({
        campaign_id: campaign.id,
        member_id: member.id,
        channel: channel,
        status: sendStatus,
        external_id: externalId,
      });

      if (sendError) {
        const contact = channel === "email" ? member.email : member.phone;
        errors.push(`Failed to send to ${contact}: ${sendError}`);
      } else {
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Campaign run error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
