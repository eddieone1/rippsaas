/**
 * Cron job: detect and update at-risk members (churn risk level/score) for all gyms.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { calculateChurnRisk } from '@/lib/churn-risk';

const BATCH_SIZE = 100;

export interface DetectAllAtRiskMembersResult {
  total: number;
  updated: number;
  errors: number;
  gyms: number;
}

export async function detectAllAtRiskMembers(): Promise<DetectAllAtRiskMembersResult> {
  const admin = createAdminClient();
  let total = 0;
  let updated = 0;
  let errors = 0;
  let gyms = 0;

  const { data: gymList } = await admin.from('gyms').select('id');
  if (!gymList?.length) return { total: 0, updated: 0, errors: 0, gyms: 0 };

  for (const gym of gymList) {
    gyms++;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: members, error: fetchError } = await admin
        .from('members')
        .select('id, commitment_score, last_visit_date, joined_date')
        .eq('gym_id', gym.id)
        .in('status', ['active', 'inactive'])
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error(`[at-risk-detection] gym ${gym.id} fetch error:`, fetchError);
        errors += 1;
        break;
      }
      if (!members?.length) {
        hasMore = false;
        break;
      }

      total += members.length;
      for (const member of members) {
        const riskResult = calculateChurnRisk({
          last_visit_date: member.last_visit_date,
          joined_date: member.joined_date,
          commitment_score: member.commitment_score ?? null,
        });
        const { error: updateError } = await admin
          .from('members')
          .update({
            churn_risk_level: riskResult.level,
            churn_risk_score: riskResult.score,
          })
          .eq('id', member.id);
        if (updateError) {
          console.error(`[at-risk-detection] update member ${member.id}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      }
      offset += BATCH_SIZE;
      hasMore = members.length === BATCH_SIZE;
    }
  }

  return { total, updated, errors, gyms };
}

/** Run at-risk detection for a single gym (e.g. after member upload). */
export async function detectAtRiskMembersForGym(gymId: string): Promise<DetectAllAtRiskMembersResult> {
  const admin = createAdminClient();
  let total = 0;
  let updated = 0;
  let errors = 0;

  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const { data: members, error: fetchError } = await admin
      .from('members')
      .select('id, commitment_score, last_visit_date, joined_date')
      .eq('gym_id', gymId)
      .in('status', ['active', 'inactive'])
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      console.error(`[at-risk-detection] gym ${gymId} fetch error:`, fetchError);
      break;
    }
    if (!members?.length) break;

    total += members.length;
    for (const member of members) {
      const riskResult = calculateChurnRisk({
        last_visit_date: member.last_visit_date,
        joined_date: member.joined_date,
        commitment_score: member.commitment_score ?? null,
      });
      const { error: updateError } = await admin
        .from('members')
        .update({
          churn_risk_level: riskResult.level,
          churn_risk_score: riskResult.score,
        })
        .eq('id', member.id);
      if (updateError) errors++;
      else updated++;
    }
    offset += BATCH_SIZE;
    hasMore = members.length === BATCH_SIZE;
  }

  return { total, updated, errors, gyms: 1 };
}
