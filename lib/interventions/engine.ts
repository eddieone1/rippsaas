import { getDb, generateId } from "./db";
import { applyGuardrails } from "./guardrails";
import { buildTemplateContext, renderPlayTemplates } from "./plays";
import { getEmailProvider, getSmsProvider, getWhatsAppProvider } from "./providers";
import { isInQuietHours, nextAllowedSendTime } from "./time";
import type { Channel, Member, Play, Intervention, RunDailyResult } from "./types";

export interface RunDailyOptions {
  forceApproval?: boolean;
}

export async function runDailyForTenant(
  tenantId: string,
  options?: RunDailyOptions
): Promise<RunDailyResult> {
  const result: RunDailyResult = {
    created: 0,
    scheduled: 0,
    pendingApproval: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const db = getDb();

  const { data: tenant } = await db
    .from("intervention_tenants")
    .select("timezone")
    .eq("id", tenantId)
    .single();
  const timezone = tenant?.timezone ?? "Europe/London";

  const { data: plays } = await db
    .from("intervention_plays")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .eq("trigger_type", "DAILY_BATCH")
    .order("created_at", { ascending: true });
  if (!plays || plays.length === 0) return result;

  const { data: latestRisks } = await db
    .from("intervention_risk_snapshots")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("computed_at", { ascending: false });

  const riskByMember = new Map<string, Record<string, unknown>>();
  for (const r of latestRisks ?? []) {
    const row = r as Record<string, unknown>;
    if (!riskByMember.has(row.member_id as string)) {
      riskByMember.set(row.member_id as string, row);
    }
  }

  const memberIds = Array.from(riskByMember.keys());
  if (memberIds.length === 0) return result;

  const { data: members } = await db
    .from("intervention_members")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", memberIds);
  const memberMap = new Map((members ?? []).map((m: Member) => [m.id, m]));

  const now = new Date();

  for (const play of plays as Play[]) {
    for (const memberId of memberIds) {
      const member = memberMap.get(memberId);
      const risk = riskByMember.get(memberId);
      if (!member || ((risk?.risk_score as number | undefined) ?? 0) < play.min_risk_score) {
        result.skipped++;
        continue;
      }

      const context = buildTemplateContext(member, (risk ?? null) as unknown as Parameters<typeof buildTemplateContext>[1]);
      const { subject, body } = renderPlayTemplates(play, context);

      for (const channel of play.channels) {
        const guard = await applyGuardrails(member, play, channel as Channel, timezone, now);
        if (!guard.allowed) {
          result.skipped++;
          continue;
        }

        const needsApproval = options?.forceApproval || play.requires_approval;
        const interventionId = generateId();

        const { data: intervention, error } = await db
          .from("intervention_interventions")
          .insert({
            id: interventionId,
            tenant_id: tenantId,
            play_id: play.id,
            member_id: member.id,
            status: needsApproval ? "PENDING_APPROVAL" : guard.scheduledAt ? "SCHEDULED" : "CANDIDATE",
            channel: channel as Channel,
            scheduled_at: guard.scheduledAt?.toISOString() ?? null,
            reason: risk?.primary_risk_reason ?? "High risk",
            rendered_subject: subject,
            rendered_body: body,
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to create intervention", error);
          result.failed++;
          continue;
        }
        result.created++;

        await db.from("intervention_message_events").insert({
          id: generateId(),
          intervention_id: intervention.id,
          type: "QUEUED",
          payload: { reason: guard.reason },
        });

        if (needsApproval) {
          result.pendingApproval++;
          continue;
        }
        if (guard.scheduledAt) {
          result.scheduled++;
          continue;
        }

        try {
          const sendResult = await sendOne(intervention.id, channel as Channel, member, subject, body);
          await db
            .from("intervention_interventions")
            .update({
              status: "SENT",
              sent_at: now.toISOString(),
              provider_message_id: sendResult.providerMessageId,
            })
            .eq("id", intervention.id);

          await db.from("intervention_message_events").insert({
            id: generateId(),
            intervention_id: intervention.id,
            type: "SENT",
            payload: { providerMessageId: sendResult.providerMessageId },
          });
          result.sent++;
        } catch (e) {
          await db
            .from("intervention_interventions")
            .update({ status: "FAILED" })
            .eq("id", intervention.id);

          await db.from("intervention_message_events").insert({
            id: generateId(),
            intervention_id: intervention.id,
            type: "FAILED",
            payload: { error: String(e) },
          });
          result.failed++;
        }
      }
    }
  }

  return result;
}

async function sendOne(
  _interventionId: string,
  channel: Channel,
  member: { email: string | null; phone: string | null },
  subject: string | null,
  body: string
): Promise<{ providerMessageId: string }> {
  if (channel === "EMAIL") {
    const to = member.email ?? "";
    if (!to) throw new Error("Member has no email");
    return getEmailProvider().sendEmail({ to, subject: subject ?? "", body });
  }
  if (channel === "SMS") {
    const to = member.phone ?? "";
    if (!to) throw new Error("Member has no phone");
    return getSmsProvider().sendSms({ to, body });
  }
  if (channel === "WHATSAPP") {
    const to = member.phone ?? "";
    if (!to) throw new Error("Member has no phone");
    return getWhatsAppProvider().sendWhatsApp({ to, body });
  }
  throw new Error(`Unknown channel: ${channel}`);
}

export async function approveAndSend(interventionId: string): Promise<void> {
  const db = getDb();

  const { data: intervention } = await db
    .from("intervention_interventions")
    .select("*, member:intervention_members(*), play:intervention_plays(*)")
    .eq("id", interventionId)
    .single();

  if (!intervention || intervention.status !== "PENDING_APPROVAL") {
    throw new Error("Intervention not found or not pending approval");
  }

  const { data: tenant } = await db
    .from("intervention_tenants")
    .select("timezone")
    .eq("id", intervention.tenant_id)
    .single();

  const tz = tenant?.timezone ?? "Europe/London";
  const now = new Date();
  const play = intervention.play as Play;
  const inQuiet = isInQuietHours(now, play.quiet_hours_start, play.quiet_hours_end, tz);
  const nextAllowed = nextAllowedSendTime(now, play.quiet_hours_end, tz);

  if (inQuiet) {
    await db
      .from("intervention_interventions")
      .update({ status: "SCHEDULED", scheduled_at: nextAllowed.toISOString() })
      .eq("id", interventionId);
    return;
  }

  const member = intervention.member as Member;

  try {
    const result = await sendOne(
      intervention.id,
      intervention.channel,
      { email: member.email, phone: member.phone },
      intervention.rendered_subject,
      intervention.rendered_body
    );
    await db
      .from("intervention_interventions")
      .update({
        status: "SENT",
        sent_at: now.toISOString(),
        provider_message_id: result.providerMessageId,
      })
      .eq("id", interventionId);

    await db.from("intervention_message_events").insert({
      id: generateId(),
      intervention_id: interventionId,
      type: "SENT",
      payload: { providerMessageId: result.providerMessageId },
    });
  } catch (e) {
    await db
      .from("intervention_interventions")
      .update({ status: "FAILED" })
      .eq("id", interventionId);

    await db.from("intervention_message_events").insert({
      id: generateId(),
      intervention_id: interventionId,
      type: "FAILED",
      payload: { error: String(e) },
    });
    throw e;
  }
}

export async function cancelIntervention(interventionId: string): Promise<void> {
  const db = getDb();
  await db
    .from("intervention_interventions")
    .update({ status: "CANCELED" })
    .eq("id", interventionId)
    .eq("status", "PENDING_APPROVAL");
}
