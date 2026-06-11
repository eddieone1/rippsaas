import type { EmailProvider, SmsProvider, WhatsAppProvider } from "../types";
import { getTwilioAdapter } from "./twilio";
import { getResendAdapter } from "./resend";

export type { EmailProvider, SmsProvider, WhatsAppProvider };

export function getEmailProvider(): EmailProvider {
  return getResendAdapter();
}

export function getSmsProvider(): SmsProvider {
  return getTwilioAdapter();
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return getTwilioAdapter();
}
