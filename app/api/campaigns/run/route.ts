import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";
import { successResponse, errorResponse, handleApiError } from "@/lib/api/response";
import { sendEmail, replaceTemplateVariables, createBrandedEmailTemplate } from "@/lib/email/resend";
import { sendSms } from "@/lib/sms/twilio";

export async function POST(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
      triggerDays,
      channel = "email",
      message_type = "template",
      template_id,
      custom_subject,
      custom_body,
      target_segment = "all",
      include_cancelled = false,
      member_ids: requestedMemberIds,
    } = await request.json();

    // Get gym info with branding and sender identity
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, logo_url, brand_primary_color, brand_secondary_color, sender_name, sender_email, sms_from_number, resend_api_key, twilio_account_sid, twilio_auth_token")
      .eq("id", gymId)
      .single();

    if (!gym) {
      return errorResponse("Gym not found", 404);
    }

    let atRiskMembers: Array<{ id: string; first_name: string; last_name: string; email: string | null; phone: string | null; last_visit_date: string | null; [key: string]: unknown }>;
    let segment = "all";
    let includeCancelled = false;

    if (Array.isArray(requestedMemberIds) && requestedMemberIds.length > 0) {
      // Single or specific members (e.g. from member profile "Run campaign")
      const { data: membersById } = await supabase
        .from("members")
        .select("*")
        .eq("gym_id", gymId)
        .in("id", requestedMemberIds);
      atRiskMembers = membersById ?? [];
      if (atRiskMembers.length === 0) {
        return errorResponse("No valid members found", 400);
      }
      if (channel === "email") {
        atRiskMembers = atRiskMembers.filter((m) => m.email);
      } else if (channel === "sms") {
        atRiskMembers = atRiskMembers.filter((m) => m.phone);
      }
      if (atRiskMembers.length === 0) {
        return errorResponse(
          `Selected member(s) have no ${channel === "email" ? "email" : "phone"} for this channel`,
          400
        );
      }
    } else {
      // At-risk members by threshold (campaigns page)
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - (triggerDays || 14));
      segment = ["low", "medium", "high", "all"].includes(target_segment)
        ? target_segment
        : "all";
      includeCancelled = Boolean(include_cancelled);

      let memberQuery = supabase
        .from("members")
        .select("*")
        .eq("gym_id", gymId)
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

      const { data: queried } = await memberQuery.limit(100);
      atRiskMembers = queried ?? [];
      if (atRiskMembers.length === 0) {
        return successResponse({
          sent: 0,
          message: `No members at risk for this threshold with ${channel === "email" ? "email" : "phone"} contact`,
        });
      }
    }

    // Get template or create one from custom message
    let campaignTemplate;
    let finalTemplateId;

    if (message_type === "custom") {
      if (!custom_subject || !custom_body) {
        return errorResponse("Custom subject and body are required for custom messages", 400);
      }

      // Create a temporary template for this custom message
      const { data: newTemplate, error: templateError } = await adminClient
        .from("campaign_templates")
        .insert({
          gym_id: gymId,
          name: `${triggerDays} Days Inactive - Custom`,
          subject: custom_subject,
          body: custom_body,
          channel: channel,
        })
        .select()
        .single();

      if (templateError || !newTemplate) {
        return errorResponse(`Failed to create template: ${templateError?.message}`, 500);
      }

      campaignTemplate = newTemplate;
      finalTemplateId = newTemplate.id;
    } else {
      // Use provided template
      if (!template_id) {
        return errorResponse("Template ID is required when using template message type", 400);
      }

      const { data: template } = await adminClient
        .from("campaign_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (!template || (template.gym_id !== null && template.gym_id !== gymId)) {
        return errorResponse("Template not found or not accessible", 404);
      }

      campaignTemplate = template;
      finalTemplateId = template_id;
    }

    // Get or create campaign
    let { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
        .eq("gym_id", gymId)
      .eq("trigger_days", triggerDays)
      .eq("channel", channel)
      .eq("status", "active")
      .maybeSingle();

    if (!campaign) {
      const { data: newCampaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          gym_id: gymId,
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
        return errorResponse(`Failed to create campaign: ${campaignError?.message}`, 500);
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

        // Resend "from": use gym sender identity if set
        const emailFrom =
          gym?.sender_email?.trim()
            ? (gym.sender_name?.trim()
                ? `${gym.sender_name.trim()} <${gym.sender_email.trim()}>`
                : gym.sender_email.trim())
            : undefined;

        const { id: emailId, error: emailError } = await sendEmail({
          to: member.email!,
          subject: messageSubject,
          body: messageBody,
          from: emailFrom,
        });

        externalId = emailId;
        sendError = emailError ? String(emailError) : null;
        sendStatus = emailError ? "failed" : "sent";
      } else if (channel === "sms") {
        const { id: smsId, error: smsErr } = await sendSms({
          to: member.phone!,
          body: messageBodyPlain,
          from: gym?.sms_from_number?.trim() || undefined,
          accountSid: gym?.twilio_account_sid ?? undefined,
          authToken: gym?.twilio_auth_token ?? undefined,
        });
        externalId = smsId;
        sendError = smsErr ?? null;
        sendStatus = smsErr ? "failed" : "sent";
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

    return successResponse({
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error, "Campaign run error");
  }
}
