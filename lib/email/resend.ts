import { Resend } from "resend";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
  /** When set, use this Resend API key (e.g. gym's own key); otherwise use RESEND_API_KEY env */
  apiKey?: string | null;
}

export async function sendEmail({ to, subject, body, from, apiKey: providedKey }: SendEmailParams) {
  const apiKey = (providedKey?.trim() || process.env.RESEND_API_KEY) ?? null;
  if (!apiKey) {
    console.warn("No Resend API key (gym or RESEND_API_KEY), email not sent");
    return { id: null, error: "Resend API key not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const fromAddress = from || "Rip <onboarding@resend.dev>";
    
    console.log("Sending email via Resend:", { 
      to, 
      from: fromAddress, 
      subject,
      apiKeySource: providedKey?.trim() ? "gym" : "env"
    });

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html: body.startsWith("<!DOCTYPE html>") || body.startsWith("<html") ? body : body.replace(/\n/g, "<br>"),
    });

    if (error) {
      console.error("Resend API returned error:", error);
      // Extract error message from Resend error object
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as any).message)
        : JSON.stringify(error);
      return { id: null, error: errorMessage };
    }

    console.log("Email sent successfully:", data?.id);
    return { id: data?.id || null, error: null };
  } catch (error) {
    console.error("Resend email error:", error);
    // Return error as a string message
    const errorMessage = error instanceof Error 
      ? error.message 
      : (typeof error === 'object' && error !== null && 'message' in error)
      ? String((error as any).message)
      : String(error);
    return { id: null, error: errorMessage };
  }
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

/**
 * Wraps email content in a branded HTML template
 */
export function createBrandedEmailTemplate(
  content: string,
  branding?: {
    logo_url?: string | null;
    brand_primary_color?: string | null;
    brand_secondary_color?: string | null;
    gym_name?: string | null;
  }
): string {
  const primaryColor = branding?.brand_primary_color || "#2563EB";
  const secondaryColor = branding?.brand_secondary_color || "#1E40AF";
  // Use default logo if no custom logo is set
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rip.app';
  const defaultLogoUrl = `${baseUrl}/rip dashboard logo - Edited.png`.replace(/ /g, '%20');
  const logoUrl = branding?.logo_url || defaultLogoUrl;
  const logoAlt = branding?.logo_url ? (branding.gym_name || 'Gym') : 'Rip logo';
  const logoHtml = `<img src="${logoUrl}" alt="${logoAlt}" style="max-height: 80px; max-width: 250px; margin-bottom: 20px;" />`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding?.gym_name || 'Email'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px 30px; background-color: ${primaryColor}; border-radius: 8px 8px 0 0;">
              ${logoHtml}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <div style="color: #333333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                ${content.replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
              <div style="color: #666666; font-size: 12px; text-align: center; line-height: 1.5;">
                <p style="margin: 0 0 10px 0;">
                  <strong style="color: ${primaryColor};">${branding?.gym_name || 'Your Gym'}</strong>
                </p>
                <p style="margin: 0;">
                  Thank you for being a valued member.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
