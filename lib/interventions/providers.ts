import type { EmailProvider, SmsProvider, WhatsAppProvider } from "./types";

/**
 * Returns the configured email provider (Resend).
 */
export function getEmailProvider(): EmailProvider {
  return {
    async sendEmail({ to, subject, body }) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY not set");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
          to,
          subject,
          html: body,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Resend error: ${res.status} ${text}`);
      }
      const data = await res.json();
      return { providerMessageId: data.id };
    },
  };
}

/**
 * Returns the configured SMS provider (Twilio).
 */
export function getSmsProvider(): SmsProvider {
  return {
    async sendSms({ to, body }) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio credentials not configured");
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Twilio error: ${res.status} ${text}`);
      }
      const data = await res.json();
      return { providerMessageId: data.sid };
    },
  };
}

/**
 * Returns the configured WhatsApp provider (Twilio WhatsApp).
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  return {
    async sendWhatsApp({ to, body }) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? process.env.TWILIO_FROM_NUMBER;
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio WhatsApp credentials not configured");
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `whatsapp:${to}`,
          From: `whatsapp:${fromNumber}`,
          Body: body,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Twilio WhatsApp error: ${res.status} ${text}`);
      }
      const data = await res.json();
      return { providerMessageId: data.sid };
    },
  };
}
