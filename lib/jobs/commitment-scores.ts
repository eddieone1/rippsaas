/**
 * Cron job: recalculate commitment scores for all active/inactive members.
 * Uses last_visit_date and joined_date; visit history not required for basic score.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCommitmentScore } from '@/lib/commitment-score';
import { calculateChurnRisk } from '@/lib/churn-risk';
import type { SupabaseClient } from '@supabase/supabase-js';

const BATCH_SIZE = 100;

/**
 * Fetch visit dates from member_activities for a batch of member IDs.
 * Returns a Map of member_id -> sorted visit date strings.
 */
async function fetchVisitDatesForMembers(
  admin: SupabaseClient,
  memberIds: string[]
): Promise<Map<string, string[]>> {
  const visitDatesByMember = new Map<string, string[]>();
  if (memberIds.length === 0) return visitDatesByMember;

  const { data: activities, error } = await admin
    .from('member_activities')
    .select('member_id, activity_date')
    .eq('activity_type', 'visit')
    .in('member_id', memberIds)
    .order('activity_date', { ascending: false });

  if (error) {
    console.error('[commitment-scores] failed to fetch visit activities:', error);
    return visitDatesByMember;
  }

  activities?.forEach((activity) => {
    if (!visitDatesByMember.has(activity.member_id)) {
      visitDatesByMember.set(activity.member_id, []);
    }
    visitDatesByMember.get(activity.member_id)!.push(activity.activity_date);
  });

  return visitDatesByMember;
}

export interface RecalculateAllCommitmentScoresResult {
  total: number;
  updated: number;
  errors: number;
  gyms: number;
}

export async function recalculateAllCommitmentScores(): Promise<RecalculateAllCommitmentScoresResult> {
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
        .select('id, joined_date, last_visit_date')
        .eq('gym_id', gym.id)
        .in('status', ['active', 'inactive'])
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error(`[commitment-scores] gym ${gym.id} fetch error:`, fetchError);
        errors += 1;
        break;
      }
      if (!members?.length) {
        hasMore = false;
        break;
      }

      total += members.length;

      const memberIds = members.map((m) => m.id);
      const visitDatesByMember = await fetchVisitDatesForMembers(admin, memberIds);

      for (const member of members) {
        const visitDates = visitDatesByMember.get(member.id) || [];
        const result = calculateCommitmentScore({
          joinedDate: member.joined_date,
          lastVisitDate: member.last_visit_date,
          visitDates,
          expectedVisitsPerWeek: 2,
        });
        const riskResult = calculateChurnRisk({
          last_visit_date: member.last_visit_date,
          joined_date: member.joined_date,
          commitment_score: result.score,
        });
        const { error: updateError } = await admin
          .from('members')
          .update({
            commitment_score: result.score,
            commitment_score_calculated_at: new Date().toISOString(),
            churn_risk_level: riskResult.level,
            churn_risk_score: riskResult.score,
          })
          .eq('id', member.id);
        if (updateError) {
          console.error(`[commitment-scores] update member ${member.id}:`, updateError);
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

/** Recalculate commitment scores for a single gym (e.g. after member upload). */
export async function recalculateCommitmentScoresForGym(gymId: string): Promise<RecalculateAllCommitmentScoresResult> {
  const admin = createAdminClient();
  let total = 0;
  let updated = 0;
  let errors = 0;

  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const { data: members, error: fetchError } = await admin
      .from('members')
      .select('id, joined_date, last_visit_date')
      .eq('gym_id', gymId)
      .in('status', ['active', 'inactive'])
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      console.error(`[commitment-scores] gym ${gymId} fetch error:`, fetchError);
      break;
    }
    if (!members?.length) break;

    total += members.length;

    const memberIds = members.map((m) => m.id);
    const visitDatesByMember = await fetchVisitDatesForMembers(admin, memberIds);

    for (const member of members) {
      const visitDates = visitDatesByMember.get(member.id) || [];
      const result = calculateCommitmentScore({
        joinedDate: member.joined_date,
        lastVisitDate: member.last_visit_date,
        visitDates,
        expectedVisitsPerWeek: 2,
      });
      const riskResult = calculateChurnRisk({
        last_visit_date: member.last_visit_date,
        joined_date: member.joined_date,
        commitment_score: result.score,
      });
      const { error: updateError } = await admin
        .from('members')
        .update({
          commitment_score: result.score,
          commitment_score_calculated_at: new Date().toISOString(),
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
