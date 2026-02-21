import type { SmsProvider, WhatsAppProvider, SendSmsInput, SendWhatsAppInput, SendResult } from "../types";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromSms = process.env.TWILIO_FROM_SMS;
const fromWhatsApp = process.env.TWILIO_FROM_WHATSAPP;

function isConfigured(): boolean {
  return Boolean(accountSid && authToken && fromSms);
}

const stubId = () => `stub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const twilioAdapter: SmsProvider & WhatsAppProvider = {
  async sendSms(input: SendSmsInput): Promise<SendResult> {
    if (!isConfigured()) {
      console.warn("[Twilio] SMS not configured; stubbing send", input.to);
      return { providerMessageId: stubId() };
    }
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: new URLSearchParams({
          To: input.to,
          From: fromSms!,
          Body: input.body,
        }).toString(),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Twilio SMS failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { sid?: string };
    return { providerMessageId: data.sid ?? stubId() };
  },

  async sendWhatsApp(input: SendWhatsAppInput): Promise<SendResult> {
    const from = fromWhatsApp ?? `whatsapp:${fromSms}`;
    if (!accountSid || !authToken) {
      console.warn("[Twilio] WhatsApp not configured; stubbing send", input.to);
      return { providerMessageId: stubId() };
    }
    const to = input.to.startsWith("whatsapp:") ? input.to : `whatsapp:${input.to}`;
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: input.body,
        }).toString(),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Twilio WhatsApp failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { sid?: string };
    return { providerMessageId: data.sid ?? stubId() };
  },
};

export function getTwilioAdapter(): SmsProvider & WhatsAppProvider {
  return twilioAdapter;
}
