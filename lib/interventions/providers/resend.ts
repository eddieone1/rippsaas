import type { EmailProvider, SendEmailInput, SendResult } from "../types";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Rip <onboarding@resend.dev>";

function isConfigured(): boolean {
  return Boolean(apiKey);
}

const stubId = () => `stub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const resendAdapter: EmailProvider = {
  async sendEmail(input: SendEmailInput): Promise<SendResult> {
    if (!isConfigured()) {
      console.warn("[Resend] Email not configured; stubbing send", input.to);
      return { providerMessageId: stubId() };
    }
    const resend = new Resend(apiKey!);
    const html =
      input.body.startsWith("<!DOCTYPE html>") || input.body.startsWith("<html")
        ? input.body
        : input.body.replace(/\n/g, "<br>");
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: input.to,
      subject: input.subject,
      html,
    });
    if (error) {
      throw new Error(`Resend failed: ${error.message}`);
    }
    return { providerMessageId: data?.id ?? stubId() };
  },
};

export function getResendAdapter(): EmailProvider {
  return resendAdapter;
}
