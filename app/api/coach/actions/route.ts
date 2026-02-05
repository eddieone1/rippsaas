import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCoachActions } from '@/lib/coach-actions/generate';
import { differenceInDays, parseISO, formatISO } from 'date-fns';

/**
 * GET /api/coach/actions
 * 
 * Get daily action list for current coach
 * Only shows incomplete actions for today
 */
export async function GET(request: Request) {
  try {
    const { userProfile, gymId } = await requireAuth();

    // Only coaches can access their action inbox
    if (userProfile.role !== 'coach') {
      return NextResponse.json(
        { error: 'Only coaches can access action inbox' },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    const today = formatISO(new Date(), { representation: 'date' });

    // Get members assigned to this coach
    const { data: assignments } = await adminClient
      .from('member_coaches')
      .select('member_id')
      .eq('coach_id', userProfile.id);

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        actions: [],
        total: 0,
      });
    }

    const memberIds = assignments.map((a) => a.member_id);

    // Fetch assigned members with their data (only active members)
    const { data: members } = await adminClient
      .from('members')
      .select('id, first_name, last_name, churn_risk_level, churn_risk_score, last_visit_date, commitment_score, status')
      .in('id', memberIds)
      .eq('status', 'active')
      .in('churn_risk_level', ['high', 'medium', 'low']); // Only at-risk members get actions

    if (!members || members.length === 0) {
      return NextResponse.json({
        actions: [],
        total: 0,
      });
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
      .select('id, member_id, action_type, completed_at')
      .eq('coach_id', userProfile.id)
      .eq('due_date', today);

    const existingActionMap = new Map(
      existingActions?.map((action) => [`${action.member_id}-${action.action_type}`, action]) || []
    );

    // Generate actions for today
    const generatedActions = generateCoachActions(membersWithDays, today);

    // Fetch or create actions
    const actionsToReturn = [];
    for (const generatedAction of generatedActions) {
      const key = `${generatedAction.memberId}-${generatedAction.actionType}`;
      const existing = existingActionMap.get(key);

      if (existing) {
        // Fetch full action details
        const { data: fullAction } = await adminClient
          .from('coach_actions')
          .select(`
            *,
            members!coach_actions_member_id_fkey(id, first_name, last_name, churn_risk_level, churn_risk_score)
          `)
          .eq('id', existing.id)
          .single();

        if (fullAction && !fullAction.completed_at) {
          actionsToReturn.push({
            id: fullAction.id,
            memberId: fullAction.member_id,
            memberName: `${fullAction.members?.first_name} ${fullAction.members?.last_name}`,
            actionType: fullAction.action_type,
            title: fullAction.title,
            description: fullAction.description,
            priority: fullAction.priority,
            dueDate: fullAction.due_date,
            completedAt: fullAction.completed_at,
            notes: fullAction.notes,
          });
        }
      } else {
        // Create new action
        const { data: newAction, error: createError } = await adminClient
          .from('coach_actions')
          .insert({
            coach_id: userProfile.id,
            member_id: generatedAction.memberId,
            action_type: generatedAction.actionType,
            title: generatedAction.title,
            description: generatedAction.description,
            priority: generatedAction.priority,
            due_date: generatedAction.dueDate,
          })
          .select(`
            *,
            members!coach_actions_member_id_fkey(id, first_name, last_name, churn_risk_level, churn_risk_score)
          `)
          .single();

        if (!createError && newAction) {
          actionsToReturn.push({
            id: newAction.id,
            memberId: newAction.member_id,
            memberName: `${newAction.members?.first_name} ${newAction.members?.last_name}`,
            actionType: newAction.action_type,
            title: newAction.title,
            description: newAction.description,
            priority: newAction.priority,
            dueDate: newAction.due_date,
            completedAt: newAction.completed_at,
            notes: newAction.notes,
          });
        }
      }
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    actionsToReturn.sort((a, b) => {
      return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
    });

    return NextResponse.json({
      actions: actionsToReturn,
      total: actionsToReturn.length,
    });
  } catch (error) {
    console.error('Coach actions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}
