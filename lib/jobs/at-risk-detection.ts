/**
 * Daily At-Risk Detection Job
 * 
 * Recalculates churn risk scores for all active members daily.
 * Updates churn_risk_score and churn_risk_level fields.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { calculateChurnRisk } from '@/lib/churn-risk';

interface JobResult {
  success: boolean;
  membersProcessed: number;
  membersUpdated: number;
  errors: string[];
  durationMs: number;
}

/**
 * Recalculate churn risk for all active members in a gym
 */
export async function detectAtRiskMembersForGym(gymId: string): Promise<JobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let membersProcessed = 0;
  let membersUpdated = 0;

  const adminClient = createAdminClient();

  try {
    // Fetch all active members for this gym
    const { data: members, error: fetchError } = await adminClient
      .from('members')
      .select('id, joined_date, last_visit_date')
      .eq('gym_id', gymId)
      .eq('status', 'active');

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

    // Process members in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (member) => {
          try {
            membersProcessed++;

            // Fetch visit count for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: visitCount } = await adminClient
              .from('member_activities')
              .select('*', { count: 'exact', head: true })
              .eq('member_id', member.id)
              .eq('activity_type', 'visit')
              .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0]);

            // Calculate churn risk
            const riskResult = calculateChurnRisk({
              last_visit_date: member.last_visit_date,
              joined_date: member.joined_date,
              visits_last_30_days: visitCount || 0,
            });

            // Update member with risk score and real-time churn probability
            const { error: updateError } = await adminClient
              .from('members')
              .update({
                churn_risk_score: riskResult.score,
                churn_risk_level: riskResult.level,
                churn_probability: riskResult.score,
                last_risk_calculated_at: new Date().toISOString(),
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

      // Small delay between batches
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
 * Detect at-risk members for all gyms
 * Used by the daily cron job
 */
export async function detectAllAtRiskMembers(): Promise<{
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
        const result = await detectAtRiskMembersForGym(gym.id);
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
