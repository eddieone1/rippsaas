import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCoachActions } from '@/lib/coach-actions/generate';
import { getChampCategoryForActionType } from '@/lib/coach-actions/champ';
import { differenceInDays, parseISO, formatISO } from 'date-fns';

export const dynamic = "force-dynamic";

/**
 * GET /api/coach/playbook
 *
 * Returns CHAMP playbook data for the logged-in user:
 * - assignedToday: all pending actions for today (coach-specific; empty for owners)
 * - urgent: high-priority actions (derived from commitment/risk)
 * - champGroups: actions grouped by CHAMP category (Connect, Help, Activate, Monitor, Praise)
 * - praiseSuggestions: members who re-engaged recently (for Praise card; no coach_actions rows)
 *
 * Action generation is derived from: commitment score, habit decay, recent inactivity,
 * missed sessions, and existing coach_actions. Uses existing coach_actions table only.
 */
export async function GET(request: Request) {
  try {
    const { userProfile, gymId } = await requireAuth();

    // Owners can view playbook but have no assigned members; only coaches get assigned actions
    const isCoach = userProfile.role === 'coach';
    const adminClient = createAdminClient();
    const today = formatISO(new Date(), { representation: 'date' });

    // --- Fetch or generate coach actions for today (coach-specific) ---
    let assignedToday: Array<{
      id: string;
      memberId: string;
      memberName: string;
      actionType: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      dueDate: string;
      completedAt: string | null;
      notes: string | null;
    }> = [];

    if (isCoach) {
      const { data: assignments } = await adminClient
        .from('member_coaches')
        .select('member_id')
        .eq('coach_id', userProfile.id);

      if (assignments && assignments.length > 0) {
        const memberIds = assignments.map((a) => a.member_id);
        const { data: members } = await adminClient
          .from('members')
          .select(
            'id, first_name, last_name, churn_risk_level, churn_risk_score, last_visit_date, commitment_score, status'
          )
          .in('id', memberIds)
          .eq('status', 'active')
          .in('churn_risk_level', ['high', 'medium', 'low']);

        if (members && members.length > 0) {
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

          const { data: existingActions } = await adminClient
            .from('coach_actions')
            .select('id, member_id, action_type, completed_at')
            .eq('coach_id', userProfile.id)
            .eq('due_date', today);

          const existingMap = new Map(
            existingActions?.map((a) => [
              `${a.member_id}-${a.action_type}`,
              a,
            ]) || []
          );
          const generated = generateCoachActions(membersWithDays, today);

          for (const gen of generated) {
            const key = `${gen.memberId}-${gen.actionType}`;
            const existing = existingMap.get(key);
            const member = members.find((m) => m.id === gen.memberId);
            const memberName = member
              ? `${member.first_name} ${member.last_name}`
              : 'Member';

            if (existing) {
              const { data: row } = await adminClient
                .from('coach_actions')
                .select('*')
                .eq('id', existing.id)
                .single();
              if (row && !row.completed_at) {
                assignedToday.push({
                  id: row.id,
                  memberId: row.member_id,
                  memberName,
                  actionType: row.action_type,
                  title: row.title,
                  description: row.description ?? '',
                  priority: row.priority,
                  dueDate: row.due_date,
                  completedAt: row.completed_at,
                  notes: row.notes,
                });
              }
            } else {
              const { data: inserted } = await adminClient
                .from('coach_actions')
                .insert({
                  coach_id: userProfile.id,
                  member_id: gen.memberId,
                  action_type: gen.actionType,
                  title: gen.title,
                  description: gen.description,
                  priority: gen.priority,
                  due_date: gen.dueDate,
                })
                .select('id, member_id, action_type, title, description, priority, due_date, completed_at, notes')
                .single();
              if (inserted) {
                assignedToday.push({
                  id: inserted.id,
                  memberId: inserted.member_id,
                  memberName,
                  actionType: inserted.action_type,
                  title: inserted.title,
                  description: inserted.description ?? '',
                  priority: inserted.priority,
                  dueDate: inserted.due_date,
                  completedAt: inserted.completed_at,
                  notes: inserted.notes,
                });
              }
            }
          }

          assignedToday.sort((a, b) => {
            const order = { high: 3, medium: 2, low: 1 };
            return order[b.priority] - order[a.priority];
          });
        }
      }
    }

    // Urgent = high priority, due today
    const urgent = assignedToday.filter((a) => a.priority === 'high');

    // Group assigned actions by CHAMP category for main cards
    const champGroups = [
      'connect',
      'help',
      'activate',
      'monitor',
      'praise',
    ] as const;
    const grouped = champGroups.map((categoryId) => {
      const actions =
        categoryId === 'praise'
          ? [] // Praise uses suggestions only; no stored action_type for praise
          : assignedToday.filter(
              (a) => getChampCategoryForActionType(a.actionType) === categoryId
            );
      return { categoryId, actions };
    });

    // Praise suggestions: members who re-engaged recently (campaign_sends outcome = re_engaged)
    let praiseSuggestions: Array<{ memberId: string; memberName: string }> = [];
    const fourteenDaysAgo = formatISO(
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      { representation: 'date' }
    );
    const { data: reEngagedSends } = await adminClient
      .from('campaign_sends')
      .select('member_id')
      .eq('outcome', 're_engaged')
      .gte('sent_at', fourteenDaysAgo);

    if (reEngagedSends && reEngagedSends.length > 0) {
      const memberIds = Array.from(new Set(reEngagedSends.map((r) => r.member_id))).slice(0, 10);
      const { data: praiseMembers } = await adminClient
        .from('members')
        .select('id, first_name, last_name')
        .in('id', memberIds)
        .eq('gym_id', gymId);

      praiseSuggestions = (praiseMembers || []).map((m) => ({
        memberId: m.id,
        memberName: `${m.first_name} ${m.last_name}`,
      })).slice(0, 5);
    }

    return NextResponse.json({
      assignedToday,
      urgent,
      champGroups: grouped.map((g) => ({
        categoryId: g.categoryId,
        actions: g.actions,
      })),
      praiseSuggestions,
    });
  } catch (error) {
    console.error('Playbook API error:', error);
    return NextResponse.json(
      { error: 'Failed to load playbook' },
      { status: 500 }
    );
  }
}
