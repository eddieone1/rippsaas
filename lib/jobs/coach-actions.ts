/**
 * Daily Coach Action Generation Job
 * 
 * Generates daily actions for coaches based on their assigned members.
 * Creates actions for today if they don't already exist.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateCoachActions } from '@/lib/coach-actions/generate';
import { differenceInDays, parseISO, formatISO } from 'date-fns';

interface JobResult {
  success: boolean;
  coachesProcessed: number;
  actionsCreated: number;
  errors: string[];
  durationMs: number;
}

/**
 * Generate coach actions for a specific gym
 */
export async function generateCoachActionsForGym(gymId: string): Promise<JobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let coachesProcessed = 0;
  let actionsCreated = 0;

  const adminClient = createAdminClient();
  const today = formatISO(new Date(), { representation: 'date' });

  try {
    // Fetch all coaches for this gym
    const { data: coaches, error: coachesError } = await adminClient
      .from('users')
      .select('id')
      .eq('gym_id', gymId)
      .eq('role', 'coach');

    if (coachesError) {
      throw new Error(`Failed to fetch coaches: ${coachesError.message}`);
    }

    if (!coaches || coaches.length === 0) {
      return {
        success: true,
        coachesProcessed: 0,
        actionsCreated: 0,
        errors: [],
        durationMs: Date.now() - startTime,
      };
    }

    // Process each coach
    for (const coach of coaches) {
      try {
        coachesProcessed++;

        // Get members assigned to this coach
        const { data: assignments } = await adminClient
          .from('member_coaches')
          .select('member_id')
          .eq('coach_id', coach.id);

        if (!assignments || assignments.length === 0) {
          continue; // No assigned members
        }

        const memberIds = assignments.map((a) => a.member_id);

        // Fetch assigned members with their data
        const { data: members } = await adminClient
          .from('members')
          .select(
            'id, first_name, last_name, churn_risk_level, churn_risk_score, last_visit_date, commitment_score, status'
          )
          .in('id', memberIds)
          .eq('status', 'active')
          .in('churn_risk_level', ['high', 'medium', 'low']);

        if (!members || members.length === 0) {
          continue; // No active at-risk members
        }

        // Calculate days since last visit for each member
        const membersWithDays = members.map((member) => {
          const daysSinceLastVisit = member.last_visit_date
            ? differenceInDays(new Date(), parseISO(member.last_visit_date))
            : null;

          return {
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            churn_risk_level: member.churn_risk_level,
            churn_risk_score: member.churn_risk_score,
            last_visit_date: member.last_visit_date,
            commitment_score: member.commitment_score,
            daysSinceLastVisit,
          };
        });

        // Check for existing actions for today
        const { data: existingActions } = await adminClient
          .from('coach_actions')
          .select('member_id, action_type')
          .eq('coach_id', coach.id)
          .eq('due_date', today);

        const existingActionMap = new Set(
          existingActions?.map((a) => `${a.member_id}-${a.action_type}`) || []
        );

        // Generate actions for today
        const generatedActions = generateCoachActions(membersWithDays, today);

        // Create new actions (only if they don't exist)
        for (const action of generatedActions) {
          const key = `${action.memberId}-${action.actionType}`;
          if (existingActionMap.has(key)) {
            continue; // Already exists
          }

          const { error: insertError } = await adminClient
            .from('coach_actions')
            .insert({
              coach_id: coach.id,
              member_id: action.memberId,
              action_type: action.actionType,
              title: action.title,
              description: action.description,
              priority: action.priority,
              due_date: action.dueDate,
            });

          if (insertError) {
            errors.push(
              `Coach ${coach.id}, Member ${action.memberId}: ${insertError.message}`
            );
          } else {
            actionsCreated++;
          }
        }
      } catch (error) {
        errors.push(
          `Coach ${coach.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      success: errors.length === 0,
      coachesProcessed,
      actionsCreated,
      errors,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      coachesProcessed,
      actionsCreated,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Generate coach actions for all gyms
 * Used by the daily cron job
 */
export async function generateAllCoachActions(): Promise<{
  gymsProcessed: number;
  totalCoachesProcessed: number;
  totalActionsCreated: number;
  errors: string[];
}> {
  const adminClient = createAdminClient();
  const errors: string[] = [];
  let gymsProcessed = 0;
  let totalCoachesProcessed = 0;
  let totalActionsCreated = 0;

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
        totalCoachesProcessed: 0,
        totalActionsCreated: 0,
        errors: [],
      };
    }

    // Process each gym
    for (const gym of gyms) {
      try {
        const result = await generateCoachActionsForGym(gym.id);
        gymsProcessed++;
        totalCoachesProcessed += result.coachesProcessed;
        totalActionsCreated += result.actionsCreated;
        errors.push(...result.errors);
      } catch (error) {
        errors.push(
          `Gym ${gym.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      gymsProcessed,
      totalCoachesProcessed,
      totalActionsCreated,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      gymsProcessed,
      totalCoachesProcessed,
      totalActionsCreated,
      errors,
    };
  }
}
