/**
 * Daily Commitment Score Recalculation Job
 *
 * Recalculates commitment scores and member intelligence for all active members daily:
 * member_stage, churn_probability, habit_decay_index, emotional_disengagement_flags, behaviour_interpretation.
 */

import { differenceInDays, parseISO, subDays } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateChurnRisk } from '@/lib/churn-risk';
import { calculateCommitmentScore } from '@/lib/commitment-score';
import {
  getMemberStage,
  getEmotionalDisengagementFlags,
  getHabitDecayIndex,
  getBehaviourInterpretation,
} from '@/lib/member-intelligence';

interface JobResult {
  success: boolean;
  membersProcessed: number;
  membersUpdated: number;
  errors: string[];
  durationMs: number;
}

/**
 * Recalculate commitment scores for all active members in a gym
 */
export async function recalculateCommitmentScoresForGym(gymId: string): Promise<JobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let membersProcessed = 0;
  let membersUpdated = 0;

  const adminClient = createAdminClient();

  try {
    // Fetch all members for this gym (active + cancelled for win-back stage)
    const { data: members, error: fetchError } = await adminClient
      .from('members')
      .select('id, joined_date, last_visit_date, status, churn_risk_score, churn_risk_level')
      .eq('gym_id', gymId)
      .in('status', ['active', 'inactive', 'cancelled']);

    if (fetchError) {
      throw new Error(`Failed to fetch members: ${fetchError.message}`);
    }

    if (!members || members.length === 0) {
      return {
        success: true,
        membersProcessed: 0,
        membersUpdated: 0,
        errors: [],
        durationMs: Date.now() - startTime,
      };
    }

    // Process members in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (member) => {
          try {
            membersProcessed++;

            // Fetch visit history for this member
            const { data: activities } = await adminClient
              .from('member_activities')
              .select('activity_date')
              .eq('member_id', member.id)
              .eq('activity_type', 'visit')
              .order('activity_date', { ascending: false });

            const visitDates = activities?.map((a) => a.activity_date) || [];
            const now = new Date();
            const thirtyDaysAgo = subDays(now, 30);
            const visitsLast30Days = visitDates.filter((d) => {
              try {
                const date = parseISO(d);
                return date >= thirtyDaysAgo && date <= now;
              } catch {
                return false;
              }
            }).length;

            const daysSinceJoined = differenceInDays(now, parseISO(member.joined_date));
            const daysSinceLastVisit = member.last_visit_date
              ? differenceInDays(now, parseISO(member.last_visit_date))
              : null;

            // Calculate commitment score
            const result = calculateCommitmentScore({
              joinedDate: member.joined_date,
              lastVisitDate: member.last_visit_date,
              visitDates,
              expectedVisitsPerWeek: 2, // Default assumption
            });

            // Real-time churn probability
            const churnResult = calculateChurnRisk({
              last_visit_date: member.last_visit_date,
              joined_date: member.joined_date,
              visits_last_30_days: visitsLast30Days,
            });

            const churnProbability = churnResult.score;

            const stage = getMemberStage({
              status: member.status,
              churnRiskScore: churnProbability,
              churnRiskLevel: churnResult.level,
              commitmentScore: result.score,
              habitDecayVelocity: result.habitDecayVelocity,
              daysSinceJoined,
              daysSinceLastVisit,
              visitsLast30Days,
              riskFlags: result.riskFlags,
              attendanceDecayScore: result.factorScores.attendanceDecay,
            });

            const emotionalFlags = getEmotionalDisengagementFlags(
              result.riskFlags,
              churnResult.level,
              result.score,
              result.habitDecayVelocity
            );

            const habitDecayIndex = getHabitDecayIndex(
              result.factorScores.attendanceDecay,
              result.factorScores.declineVelocity
            );

            const behaviourInterpretation = getBehaviourInterpretation(
              stage,
              result.riskFlags,
              churnProbability,
              habitDecayIndex,
              visitsLast30Days,
              daysSinceLastVisit
            );

            // Update member with commitment + intelligence fields
            const { error: updateError } = await adminClient
              .from('members')
              .update({
                commitment_score: result.score,
                commitment_score_calculated_at: new Date().toISOString(),
                churn_probability: churnProbability,
                member_stage: stage,
                habit_decay_index: habitDecayIndex,
                emotional_disengagement_flags: emotionalFlags,
                behaviour_interpretation: behaviourInterpretation,
              })
              .eq('id', member.id);

            if (updateError) {
              errors.push(`Member ${member.id}: ${updateError.message}`);
            } else {
              membersUpdated++;
            }
          } catch (error) {
            errors.push(
              `Member ${member.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        })
      );

      // Small delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < members.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      success: errors.length === 0,
      membersProcessed,
      membersUpdated,
      errors,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      membersProcessed,
      membersUpdated,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Recalculate commitment scores for all gyms
 * Used by the daily cron job
 */
export async function recalculateAllCommitmentScores(): Promise<{
  gymsProcessed: number;
  totalMembersProcessed: number;
  totalMembersUpdated: number;
  errors: string[];
}> {
  const adminClient = createAdminClient();
  const errors: string[] = [];
  let gymsProcessed = 0;
  let totalMembersProcessed = 0;
  let totalMembersUpdated = 0;

  try {
    // Fetch all gyms
    const { data: gyms, error: fetchError } = await adminClient
      .from('gyms')
      .select('id');

    if (fetchError) {
      throw new Error(`Failed to fetch gyms: ${fetchError.message}`);
    }

    if (!gyms || gyms.length === 0) {
      return {
        gymsProcessed: 0,
        totalMembersProcessed: 0,
        totalMembersUpdated: 0,
        errors: [],
      };
    }

    // Process each gym
    for (const gym of gyms) {
      try {
        const result = await recalculateCommitmentScoresForGym(gym.id);
        gymsProcessed++;
        totalMembersProcessed += result.membersProcessed;
        totalMembersUpdated += result.membersUpdated;
        errors.push(...result.errors);
      } catch (error) {
        errors.push(
          `Gym ${gym.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      gymsProcessed,
      totalMembersProcessed,
      totalMembersUpdated,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      gymsProcessed,
      totalMembersProcessed,
      totalMembersUpdated,
      errors,
    };
  }
}
