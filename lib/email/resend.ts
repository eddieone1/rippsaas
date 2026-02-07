import { Resend } from "resend";

// Lazy init so Resend is not instantiated at build time (when RESEND_API_KEY is missing)
function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmail({ to, subject, body, from }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, email not sent");
    return { id: "mock-email-id", error: null };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: from || "Rip <noreply@rip.ai>",
      to,
      subject,
      html: body.startsWith("<!DOCTYPE html>") || body.startsWith("<html") ? body : body.replace(/\n/g, "<br>"),
    });

    if (error) {
      // Extract error message from Resend error object
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as any).message)
        : JSON.stringify(error);
      throw new Error(errorMessage);
    }

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
  const logoHtml = branding?.logo_url
    ? `<img src="${branding.logo_url}" alt="${branding.gym_name || 'Gym'}" style="max-height: 60px; max-width: 200px; margin-bottom: 20px;" />`
    : `<div style="font-size: 24px; font-weight: bold; color: ${primaryColor}; margin-bottom: 20px;">${branding?.gym_name || 'Gym'}</div>`;
  
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
