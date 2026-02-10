/**
 * Send SMS via Twilio.
 * Set env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (E.164, e.g. +1234567890).
 * Optional: gym can override "from" with sms_from_number (E.164).
 */

export interface SendSmsParams {
  to: string;
  body: string;
  from?: string | null;
}

export interface SendSmsResult {
  id: string | null;
  error: string | null;
}

export async function sendSms({ to, body, from }: SendSmsParams): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const defaultFrom = process.env.TWILIO_PHONE_NUMBER;
  const fromNumber = (from?.trim() || defaultFrom?.trim()) ?? null;

  if (!accountSid || !authToken) {
    console.warn("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured, SMS not sent");
    return { id: null, error: "SMS not configured" };
  }

  if (!fromNumber) {
    return { id: null, error: "No SMS 'from' number (set TWILIO_PHONE_NUMBER or gym sms_from_number)" };
  }

  const normalizedTo = to.trim().startsWith("+") ? to.trim() : `+${to.trim()}`;

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const form = new URLSearchParams({
      To: normalizedTo,
      From: fromNumber,
      Body: body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );

    const data = (await res.json()) as { sid?: string; message?: string; code?: number };

    if (!res.ok) {
      const msg = data.message || data.code ? `Twilio error ${data.code}` : "Failed to send SMS";
      return { id: null, error: msg };
    }

    return { id: data.sid ?? null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Twilio SMS error:", err);
    return { id: null, error: msg };
  }
}
