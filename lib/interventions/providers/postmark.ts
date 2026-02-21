import type { EmailProvider, SendEmailInput, SendResult } from "../types";

const serverToken = process.env.POSTMARK_SERVER_TOKEN;
const fromEmail = process.env.POSTMARK_FROM_EMAIL;

function isConfigured(): boolean {
  return Boolean(serverToken && fromEmail);
}

const stubId = () => `stub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const postmarkAdapter: EmailProvider = {
  async sendEmail(input: SendEmailInput): Promise<SendResult> {
    if (!isConfigured()) {
      console.warn("[Postmark] Email not configured; stubbing send", input.to);
      return { providerMessageId: stubId() };
    }
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": serverToken!,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: input.to,
        Subject: input.subject,
        TextBody: input.body,
        MessageStream: "outbound",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Postmark failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { MessageID?: string };
    return { providerMessageId: data.MessageID ?? stubId() };
  },
};

export function getPostmarkAdapter(): EmailProvider {
  return postmarkAdapter;
}
