import type { Member, Play, Channel } from "./types";
import { getDb } from "./db";
import { isInQuietHours, nextAllowedSendTime } from "./time";

const ONE_WEEK_DAYS = 7;

export interface GuardrailResult {
  allowed: boolean;
  scheduledAt?: Date;
  reason?: string;
}

/**
 * Check doNotContact.
 */
export function checkDoNotContact(member: Member): GuardrailResult {
  if (member.do_not_contact) {
    return { allowed: false, reason: "Member has doNotContact" };
  }
  return { allowed: true };
}

/**
 * Check channel consent.
 */
export function checkConsent(member: Member, channel: Channel): GuardrailResult {
  if (channel === "EMAIL" && !member.consent_email) {
    return { allowed: false, reason: "No email consent" };
  }
  if (channel === "SMS" && !member.consent_sms) {
    return { allowed: false, reason: "No SMS consent" };
  }
  if (channel === "WHATSAPP" && !member.consent_whatsapp) {
    return { allowed: false, reason: "No WhatsApp consent" };
  }
  return { allowed: true };
}

/**
 * Check quiet hours; if in quiet hours return scheduledAt for next allowed time.
 */
export function checkQuietHours(
  play: Play,
  tenantTimezone: string,
  now: Date = new Date()
): GuardrailResult {
  if (isInQuietHours(now, play.quiet_hours_start, play.quiet_hours_end, tenantTimezone)) {
    const next = nextAllowedSendTime(now, play.quiet_hours_end, tenantTimezone);
    return { allowed: true, scheduledAt: next };
  }
  return { allowed: true };
}

/**
 * Per-member weekly cap: count interventions SENT/DELIVERED/FAILED in last 7 days.
 */
export async function checkWeeklyCap(
  tenantId: string,
  memberId: string,
  maxPerWeek: number
): Promise<GuardrailResult> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - ONE_WEEK_DAYS);

  const db = getDb();
  const { count } = await db
    .from("intervention_interventions")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId)
    .in("status", ["SENT", "DELIVERED", "FAILED"])
    .gte("sent_at", weekAgo.toISOString());

  const total = count ?? 0;
  if (total >= maxPerWeek) {
    return { allowed: false, reason: `Weekly cap reached (${total}/${maxPerWeek})` };
  }
  return { allowed: true };
}

/**
 * Cooldown: same play to same member within cooldownDays.
 */
export async function checkCooldown(
  playId: string,
  memberId: string,
  cooldownDays: number
): Promise<GuardrailResult> {
  const since = new Date();
  since.setDate(since.getDate() - cooldownDays);

  const db = getDb();
  const { data: recent } = await db
    .from("intervention_interventions")
    .select("id")
    .eq("play_id", playId)
    .eq("member_id", memberId)
    .gte("created_at", since.toISOString())
    .not("status", "eq", "CANCELED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    return { allowed: false, reason: `Cooldown: last send ${cooldownDays}d ago` };
  }
  return { allowed: true };
}

/**
 * Run all guardrails; returns first failure or scheduledAt if quiet hours.
 */
export async function applyGuardrails(
  member: Member,
  play: Play,
  channel: Channel,
  tenantTimezone: string,
  now: Date = new Date()
): Promise<GuardrailResult> {
  let r = checkDoNotContact(member);
  if (!r.allowed) return r;
  r = checkConsent(member, channel);
  if (!r.allowed) return r;
  r = checkQuietHours(play, tenantTimezone, now);
  if (!r.allowed) return r;
  if (r.scheduledAt) return r;
  r = await checkWeeklyCap(
    member.tenant_id,
    member.id,
    play.max_messages_per_member_per_week
  );
  if (!r.allowed) return r;
  r = await checkCooldown(play.id, member.id, play.cooldown_days);
  if (!r.allowed) return r;
  return { allowed: true };
}
