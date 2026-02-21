// ---- Enums ----

export type TriggerType = "DAILY_BATCH" | "EVENT_WEBHOOK";
export type Channel = "EMAIL" | "SMS" | "WHATSAPP";
export type InterventionStatus =
  | "CANDIDATE"
  | "PENDING_APPROVAL"
  | "SCHEDULED"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELED";
export type MessageEventType = "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "REPLIED";
export type OutcomeType =
  | "CONTACTED"
  | "REPLIED"
  | "BOOKED"
  | "RETURNED"
  | "PAYMENT_RESOLVED"
  | "FROZEN"
  | "CANCELLED"
  | "SAVED";

// ---- Row types (matching Supabase table columns, snake_case) ----

export interface Tenant {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  tenant_id: string;
  external_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  consent_email: boolean;
  consent_sms: boolean;
  consent_whatsapp: boolean;
  do_not_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiskSnapshot {
  id: string;
  tenant_id: string;
  member_id: string;
  risk_score: number;
  primary_risk_reason: string | null;
  computed_at: string;
  created_at: string;
}

export interface Play {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: TriggerType;
  min_risk_score: number;
  channels: Channel[];
  requires_approval: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_messages_per_member_per_week: number;
  cooldown_days: number;
  template_subject: string | null;
  template_body: string;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: string;
  tenant_id: string;
  play_id: string;
  member_id: string;
  status: InterventionStatus;
  channel: Channel;
  scheduled_at: string | null;
  sent_at: string | null;
  provider_message_id: string | null;
  reason: string | null;
  rendered_subject: string | null;
  rendered_body: string;
  created_at: string;
  updated_at: string;
}

export interface MessageEvent {
  id: string;
  intervention_id: string;
  type: MessageEventType;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Outcome {
  id: string;
  tenant_id: string;
  member_id: string;
  type: OutcomeType;
  notes: string | null;
  occurred_at: string;
  created_at: string;
}

// ---- Template context ----

export interface TemplateContext {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  riskScore: number;
  primaryRiskReason?: string;
  daysSinceLastVisit?: number;
  [key: string]: string | number | undefined;
}

// ---- Provider interfaces ----

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendSmsInput {
  to: string;
  body: string;
}

export interface SendWhatsAppInput {
  to: string;
  body: string;
}

export interface SendResult {
  providerMessageId: string;
}

export interface EmailProvider {
  sendEmail(input: SendEmailInput): Promise<SendResult>;
}

export interface SmsProvider {
  sendSms(input: SendSmsInput): Promise<SendResult>;
}

export interface WhatsAppProvider {
  sendWhatsApp(input: SendWhatsAppInput): Promise<SendResult>;
}

export interface RunDailyResult {
  created: number;
  scheduled: number;
  pendingApproval: number;
  sent: number;
  failed: number;
  skipped: number;
}
