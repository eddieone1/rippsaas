import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { verifyCronAuth, runSafeJob, logJobExecution } from "@/lib/jobs/safety";
import {
  auditDay1Email,
  subscribeDay3Email,
  subscribeDay7Email,
  wholeDaysSince,
} from "@/lib/nurture-emails";

/**
 * POST /api/cron/subscription-nudges
 *
 * Replaces trial-reminders. Sends nurture emails for the audit → subscribe funnel:
 * - Day 1 after audit request: follow-up / CSV reminder
 * - Day 3 after onboarding without active subscription: subscribe nudge
 * - Day 7 same cohort: plan comparison nudge
 *
 * Schedule: Daily at 10:00 UTC (see vercel.json)
 */
export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSafeJob(
    "subscription-nudges",
    async () => {
      const adminClient = createAdminClient();
      const now = new Date();

      let sentAuditDay1 = 0;
      let sentSubscribe3d = 0;
      let sentSubscribe7d = 0;

      // --- Audit day-1 follow-ups ---
      const { data: auditRequests } = await adminClient
        .from("audit_requests")
        .select("id, gym_name, contact_name, email, created_at, nurture_day1_sent_at")
        .is("nurture_day1_sent_at", null);

      for (const req of auditRequests ?? []) {
        if (wholeDaysSince(req.created_at, now) !== 1) continue;

        const { subject, body } = auditDay1Email({
          contactName: req.contact_name,
          gymName: req.gym_name,
        });

        const { error } = await sendEmail({ to: req.email, subject, body });
        if (!error) {
          await adminClient
            .from("audit_requests")
            .update({ nurture_day1_sent_at: now.toISOString() })
            .eq("id", req.id);
          sentAuditDay1++;
        }
      }

      // --- Subscribe nudges: gyms with completed onboarding, no active plan ---
      const { data: owners } = await adminClient
        .from("users")
        .select("gym_id, onboarding_completed_at")
        .eq("role", "owner")
        .not("onboarding_completed_at", "is", null);

      const gymIds = Array.from(
        new Set((owners ?? []).map((o) => o.gym_id).filter(Boolean))
      );
      if (gymIds.length) {
        const { data: gyms } = await adminClient
          .from("gyms")
          .select(
            "id, name, owner_email, subscription_status, plan_id, nurture_subscribe_3d_sent_at, nurture_subscribe_7d_sent_at"
          )
          .in("id", gymIds)
          .neq("subscription_status", "active");

        const onboardingByGym = new Map(
          (owners ?? []).map((o) => [o.gym_id, o.onboarding_completed_at as string])
        );

        for (const gym of gyms ?? []) {
          const completedAt = onboardingByGym.get(gym.id);
          if (!completedAt) continue;

          // Skip free-audit-only leads — they are not subscription prospects yet
          if (gym.plan_id === "free_audit") continue;

          const daysSince = wholeDaysSince(completedAt, now);

          if (daysSince === 3 && !gym.nurture_subscribe_3d_sent_at) {
            const { subject, body } = subscribeDay3Email({ gymName: gym.name });
            const { error } = await sendEmail({
              to: gym.owner_email,
              subject,
              body,
            });
            if (!error) {
              await adminClient
                .from("gyms")
                .update({ nurture_subscribe_3d_sent_at: now.toISOString() })
                .eq("id", gym.id);
              sentSubscribe3d++;
            }
          }

          if (daysSince === 7 && !gym.nurture_subscribe_7d_sent_at) {
            const { subject, body } = subscribeDay7Email({ gymName: gym.name });
            const { error } = await sendEmail({
              to: gym.owner_email,
              subject,
              body,
            });
            if (!error) {
              await adminClient
                .from("gyms")
                .update({ nurture_subscribe_7d_sent_at: now.toISOString() })
                .eq("id", gym.id);
              sentSubscribe7d++;
            }
          }
        }
      }

      return { sentAuditDay1, sentSubscribe3d, sentSubscribe7d };
    },
    { timeoutMs: 60000 }
  );

  logJobExecution("subscription-nudges", result);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    sentAuditDay1: result.result?.sentAuditDay1 ?? 0,
    sentSubscribe3d: result.result?.sentSubscribe3d ?? 0,
    sentSubscribe7d: result.result?.sentSubscribe7d ?? 0,
  });
}
