/**
 * Cron job: generate coach actions for today for all coaches with assigned members.
 * Idempotent: only creates actions that don't already exist for today.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateCoachActions } from '@/lib/coach-actions/generate';
import { differenceInDays, parseISO, formatISO } from 'date-fns';

export interface GenerateAllCoachActionsResult {
  coachesProcessed: number;
  actionsCreated: number;
  errors: number;
}

export async function generateAllCoachActions(): Promise<GenerateAllCoachActionsResult> {
  const admin = createAdminClient();
  const today = formatISO(new Date(), { representation: 'date' });
  let coachesProcessed = 0;
  let actionsCreated = 0;
  let errors = 0;

  const { data: assignments } = await admin
    .from('member_coaches')
    .select('coach_id, member_id');
  if (!assignments?.length) return { coachesProcessed: 0, actionsCreated: 0, errors: 0 };

  const coachToMembers = new Map<string, string[]>();
  for (const a of assignments) {
    const list = coachToMembers.get(a.coach_id) ?? [];
    list.push(a.member_id);
    coachToMembers.set(a.coach_id, list);
  }

  for (const [coachId, memberIds] of Array.from(coachToMembers.entries())) {
    const uniqueMemberIds = Array.from(new Set(memberIds));
    const { data: members, error: fetchError } = await admin
      .from('members')
      .select('id, first_name, last_name, churn_risk_level, churn_risk_score, last_visit_date, commitment_score, status')
      .in('id', uniqueMemberIds)
      .eq('status', 'active')
      .in('churn_risk_level', ['high', 'medium', 'low']);

    if (fetchError || !members?.length) continue;

    const membersWithDays = members.map((m) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      churn_risk_level: m.churn_risk_level,
      churn_risk_score: m.churn_risk_score,
      last_visit_date: m.last_visit_date,
      commitment_score: m.commitment_score,
      daysSinceLastVisit: m.last_visit_date
        ? differenceInDays(new Date(), parseISO(m.last_visit_date))
        : null,
    }));

    const generated = generateCoachActions(membersWithDays, today);
    const { data: existing } = await admin
      .from('coach_actions')
      .select('member_id, action_type')
      .eq('coach_id', coachId)
      .eq('due_date', today);
    const existingSet = new Set((existing ?? []).map((e) => `${e.member_id}-${e.action_type}`));

    for (const action of generated) {
      if (existingSet.has(`${action.memberId}-${action.actionType}`)) continue;
      const { error: insertError } = await admin.from('coach_actions').insert({
        coach_id: coachId,
        member_id: action.memberId,
        action_type: action.actionType,
        title: action.title,
        description: action.description,
        priority: action.priority,
        due_date: action.dueDate,
      });
      if (insertError) errors++;
      else actionsCreated++;
    }
    coachesProcessed++;
  }

  return { coachesProcessed, actionsCreated, errors };
}
