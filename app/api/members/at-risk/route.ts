import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCommitmentScore } from '@/lib/commitment-score';
import { z } from 'zod';

const querySchema = z.object({
  riskLevel: z.enum(['all', 'high', 'medium', 'low']).default('all'),
  assigned: z.enum(['all', 'assigned', 'unassigned']).default('all'),
  sortBy: z.enum(['commitment_score', 'churn_risk_score', 'last_visit_date', 'last_contacted', 'name']).default('commitment_score'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /api/members/at-risk
 * 
 * Fetch at-risk members with:
 * - Filtering by risk level
 * - Sorting by commitment score, risk score, last visit, or name
 * - Pagination
 * - Coach assignments
 * - Commitment scores
 */
export async function GET(request: Request) {
  try {
    const { gymId } = await requireAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      riskLevel: searchParams.get('riskLevel') || 'all',
      assigned: searchParams.get('assigned') || 'all',
      sortBy: searchParams.get('sortBy') || 'commitment_score',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    });

    // Build base query - only active members at risk
    let query = adminClient
      .from('members')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        joined_date,
        last_visit_date,
        status,
        churn_risk_score,
        churn_risk_level,
        commitment_score,
        commitment_score_calculated_at
      `)
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .in('churn_risk_level', ['high', 'medium', 'low']);

    // Filter by risk level
    if (params.riskLevel !== 'all') {
      query = query.eq('churn_risk_level', params.riskLevel);
    }

    // Assigned filter: fetch at-risk IDs, filter by coach assignment
    let idsToFetch = null as string[] | null;
    if (params.assigned !== 'all') {
      const idsQuery = adminClient
        .from('members')
        .select('id')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .in('churn_risk_level', ['high', 'medium', 'low']);
      const riskFilteredQuery = params.riskLevel === 'all' ? idsQuery : idsQuery.eq('churn_risk_level', params.riskLevel);
      const { data: atRiskRows } = await riskFilteredQuery;
      const atRiskIds = atRiskRows?.map((r: { id: string }) => r.id) ?? [];
      const { data: coachRows } = await adminClient
        .from('member_coaches')
        .select('member_id')
        .in('member_id', atRiskIds);
      const assignedSet = new Set(coachRows?.map((r: { member_id: string }) => r.member_id) ?? []);
      idsToFetch = params.assigned === 'assigned'
        ? atRiskIds.filter((id) => assignedSet.has(id))
        : atRiskIds.filter((id) => !assignedSet.has(id));
      if (idsToFetch.length === 0) {
        return NextResponse.json({
          members: [],
          total: 0,
          page: params.page,
          limit: params.limit,
          totalPages: 0,
        });
      }
      query = query.in('id', idsToFetch);
    }

    // Apply sorting
    const sortAscending = params.sortOrder === 'asc';
    switch (params.sortBy) {
      case 'commitment_score':
        query = query.order('commitment_score', { ascending: sortAscending, nullsFirst: false });
        query = query.order('churn_risk_score', { ascending: false });
        break;
      case 'churn_risk_score':
        query = query.order('churn_risk_score', { ascending: !sortAscending });
        query = query.order('commitment_score', { ascending: true, nullsFirst: false });
        break;
      case 'last_visit_date':
        query = query.order('last_visit_date', { ascending: sortAscending, nullsFirst: true });
        query = query.order('churn_risk_score', { ascending: false });
        break;
      case 'last_contacted':
        query = query.order('last_visit_date', { ascending: sortAscending, nullsFirst: true });
        break;
      case 'name':
        query = query.order('last_name', { ascending: sortAscending });
        query = query.order('first_name', { ascending: sortAscending });
        break;
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);

    const { data: members, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch members: ${error.message}` },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        members: [],
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 0,
      });
    }

    // Get total count for pagination (respect assigned filter)
    let countQuery = adminClient
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .in('churn_risk_level', ['high', 'medium', 'low']);

    if (params.riskLevel !== 'all') {
      countQuery = countQuery.eq('churn_risk_level', params.riskLevel);
    }
    if (params.assigned !== 'all' && idsToFetch) {
      countQuery = countQuery.in('id', idsToFetch);
    }

    const { count } = await countQuery;
    const total = count || 0;

    // Fetch coach assignments for these members
    const memberIds = members.map((m) => m.id);
    const { data: coachAssignments } = await adminClient
      .from('member_coaches')
      .select(`
        member_id,
        coach_id,
        users!member_coaches_coach_id_fkey(id, full_name, email)
      `)
      .in('member_id', memberIds);

    // Create coach lookup map
    const coachMap = new Map<string, { id: string; name: string; email: string }>();
    coachAssignments?.forEach((assignment: any) => {
      if (assignment.users) {
        coachMap.set(assignment.member_id, {
          id: assignment.coach_id,
          name: assignment.users.full_name,
          email: assignment.users.email,
        });
      }
    });

    // Last contacted: max of campaign_sends.sent_at and coach_touches.created_at per member
    const { data: campaigns } = await supabase.from('campaigns').select('id').eq('gym_id', gymId);
    const campaignIds = campaigns?.map((c) => c.id) ?? [];
    const lastContactByMember = new Map<string, string>();
    if (campaignIds.length > 0) {
      const { data: sends } = await supabase
        .from('campaign_sends')
        .select('member_id, sent_at')
        .in('campaign_id', campaignIds)
        .in('member_id', memberIds);
      sends?.forEach((s: { member_id: string; sent_at: string }) => {
        const cur = lastContactByMember.get(s.member_id);
        if (!cur || s.sent_at > cur) lastContactByMember.set(s.member_id, s.sent_at);
      });
    }
    const { data: touches } = await adminClient
      .from('coach_touches')
      .select('member_id, created_at')
      .eq('gym_id', gymId)
      .in('member_id', memberIds);
    touches?.forEach((t: { member_id: string; created_at: string }) => {
      const cur = lastContactByMember.get(t.member_id);
      if (!cur || t.created_at > cur) lastContactByMember.set(t.member_id, t.created_at);
    });

    // Fetch visit history for commitment score calculation (if needed)
    // Only calculate for members without recent commitment scores
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const membersNeedingScore = members.filter(
      (m) => !m.commitment_score || 
      !m.commitment_score_calculated_at ||
      new Date(m.commitment_score_calculated_at) < oneDayAgo
    );

    if (membersNeedingScore.length > 0) {
      // Fetch visit activities for members needing score calculation
      const { data: activities } = await adminClient
        .from('member_activities')
        .select('member_id, activity_date')
        .eq('activity_type', 'visit')
        .in('member_id', membersNeedingScore.map((m) => m.id))
        .order('activity_date', { ascending: false });

      // Group activities by member
      const activitiesByMember = new Map<string, string[]>();
      activities?.forEach((activity) => {
        if (!activitiesByMember.has(activity.member_id)) {
          activitiesByMember.set(activity.member_id, []);
        }
        activitiesByMember.get(activity.member_id)!.push(activity.activity_date);
      });

      // Calculate and update commitment scores
      const updates = [];
      for (const member of membersNeedingScore) {
        const visitDates = activitiesByMember.get(member.id) || [];
        
        const commitmentResult = calculateCommitmentScore({
          joinedDate: member.joined_date,
          lastVisitDate: member.last_visit_date,
          visitDates,
          expectedVisitsPerWeek: 2,
        });

        updates.push(
          adminClient
            .from('members')
            .update({
              commitment_score: commitmentResult.score,
              commitment_score_calculated_at: new Date().toISOString(),
            })
            .eq('id', member.id)
        );

        // Update member object with calculated score
        const memberIndex = members.findIndex((m) => m.id === member.id);
        if (memberIndex !== -1) {
          members[memberIndex].commitment_score = commitmentResult.score;
          members[memberIndex].commitment_score_calculated_at = new Date().toISOString();
        }
      }

      // Execute updates in parallel (fire and forget for performance)
      Promise.all(updates).catch((err) => {
        console.error('Failed to update commitment scores:', err);
      });
    }

    // Format response with coach assignments and last_contacted
    const formattedMembers = members.map((member) => ({
      ...member,
      coach: coachMap.get(member.id) || null,
      last_contacted_at: lastContactByMember.get(member.id) || null,
    }));

    return NextResponse.json({
      members: formattedMembers,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('At-risk members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch at-risk members' },
      { status: 500 }
    );
  }
}
