import type { EmailProvider, SmsProvider, WhatsAppProvider } from "../types";
import { getTwilioAdapter } from "./twilio";
import { getPostmarkAdapter } from "./postmark";

export type { EmailProvider, SmsProvider, WhatsAppProvider };

export function getEmailProvider(): EmailProvider {
  return getPostmarkAdapter();
}

export function getSmsProvider(): SmsProvider {
  return getTwilioAdapter();
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return getTwilioAdapter();
}
