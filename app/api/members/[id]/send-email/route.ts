import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import { successResponse, errorResponse, handleApiError } from "@/lib/api/response";
import { sendEmail, replaceTemplateVariables, createBrandedEmailTemplate } from "@/lib/email/resend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;

    // Get request body
    const body = await request.json();
    const emailType = body.email_type || "we_miss_you"; // Default to "we_miss_you"

    // Get member information
    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .eq("gym_id", gymId)
      .single();

    if (!member || !member.email) {
      return errorResponse("Member not found or has no email", 404);
    }

    // Get gym information with branding and sender identity
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, logo_url, brand_primary_color, brand_secondary_color, sender_name, sender_email, resend_api_key")
      .eq("id", gymId)
      .single();

    const gymName = gym?.name || "your gym";

    const emailFrom =
      gym?.sender_email?.trim()
        ? (gym.sender_name?.trim()
            ? `${gym.sender_name.trim()} <${gym.sender_email.trim()}>`
            : gym.sender_email.trim())
        : undefined;

    // Define email templates
    const emailTemplates: Record<string, { subject: string; body: string }> = {
      we_miss_you: {
        subject: `We haven't seen you in a while, {{first_name}}!`,
        body: `Hi {{first_name}},

We've noticed you haven't been to {{gym_name}} recently, and we wanted to check in. We miss having you around!

Our doors are always open, and we'd love to welcome you back. Whether you're ready to jump back into your routine or just want to catch up, we're here for you.

Is there anything we can do to help you get back on track? Our team is always happy to assist with:
- Creating a workout plan that fits your schedule
- Answering any questions you might have
- Finding a class or activity that excites you

We look forward to seeing you soon!

Best regards,
The team at {{gym_name}}`,
      },
      bring_a_friend: {
        subject: `Bring a friend on us, {{first_name}}!`,
        body: `Hi {{first_name}},

We'd love to see you back at {{gym_name}} soon!

As a special treat, we're offering you a FREE guest pass to bring a friend with you on your next visit. It's a great way to catch up with someone you care about while getting active together.

Here's how it works:
1. Come in for your workout
2. Bring a friend along - they work out FREE
3. Both of you get to enjoy our facilities and classes

No strings attached - just our way of saying we value your membership and want to see you thriving with us!

We can't wait to welcome you both back.

See you soon,
The team at {{gym_name}}`,
      },
    };

    // Get the appropriate template
    const template = emailTemplates[emailType] || emailTemplates.we_miss_you;

    // Replace template variables
    const emailSubject = replaceTemplateVariables(template.subject, {
      first_name: member.first_name,
      gym_name: gymName,
    });

    const lastVisitDate = member.last_visit_date
      ? new Date(member.last_visit_date).toLocaleDateString("en-GB")
      : "recently";

    const emailBodyPlain = replaceTemplateVariables(template.body, {
      first_name: member.first_name,
      gym_name: gymName,
      last_visit_date: lastVisitDate,
    });

    // Create branded email template
    const emailBody = createBrandedEmailTemplate(emailBodyPlain, {
      logo_url: gym?.logo_url,
      brand_primary_color: gym?.brand_primary_color,
      brand_secondary_color: gym?.brand_secondary_color,
      gym_name: gymName,
    });

    // Send email via Resend (from gym sender identity when set)
    const { id: emailId, error: emailError } = await sendEmail({
      to: member.email,
      subject: emailSubject,
      body: emailBody,
      from: emailFrom,
      apiKey: gym?.resend_api_key ?? undefined,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      const errorMessage = typeof emailError === 'string' 
        ? emailError 
        : (emailError as unknown) instanceof Error 
        ? (emailError as Error).message 
        : String(emailError);
      return errorResponse(`Failed to send email: ${errorMessage}`, 500);
    }

    // Note: We don't have a campaign_id for manual sends, so we'll just log it
    // In a production system, you might want to create a "manual" campaign or store this differently
    console.log(`Email sent to ${member.email} (${emailType}):`, emailId);

    return successResponse({
      message: "Email sent successfully!",
      email_id: emailId,
    });
  } catch (error) {
    return handleApiError(error, "Send email error");
  }
}
