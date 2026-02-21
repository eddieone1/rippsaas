import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import { successResponse, handleApiError } from "@/lib/api/response";
import type {
  Member,
  Coach,
  Touch,
  MemberStatus,
  HabitDecayLevel,
  ReasonChip,
} from "@/components/coach-accountability/types";

/**
 * GET /api/coach-accountability
 *
 * Returns members, coaches, touches, and plays for the coach accountability page.
 * Members are transformed from the DB schema into the Coach Accountability shape.
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    // Fetch members, coaches, assignments, and touches in parallel
    const [membersRes, coachesRes, assignmentsRes, touchesRes] =
      await Promise.all([
        supabase
          .from("members")
          .select(
            "id, first_name, last_name, email, phone, status, churn_risk_score, churn_risk_level, last_visit_date, membership_type_id, commitment_score, habit_decay_index, emotional_disengagement_flags, member_stage"
          )
          .eq("gym_id", gymId)
          .in("status", ["active", "inactive", "cancelled"]),

        supabase
          .from("users")
          .select("id, full_name, role")
          .eq("gym_id", gymId),

        supabase
          .from("member_coaches")
          .select("member_id, coach_id, saved")
          .eq("gym_id", gymId),

        supabase
          .from("coach_touches")
          .select("id, member_id, coach_id, channel, type, outcome, notes, play_id, created_at")
          .eq("gym_id", gymId)
          .order("created_at", { ascending: false }),
      ]);

    // Fetch membership types for plan name + price
    const membershipTypeIds = Array.from(
      new Set(
        (membersRes.data ?? [])
          .map((m) => m.membership_type_id)
          .filter(Boolean) as string[]
      )
    );

    let membershipTypesMap: Record<
      string,
      { name: string; price: number | null }
    > = {};
    if (membershipTypeIds.length > 0) {
      const { data: mtData } = await supabase
        .from("membership_types")
        .select("id, name, price")
        .in("id", membershipTypeIds);

      if (mtData) {
        for (const mt of mtData) {
          membershipTypesMap[mt.id] = { name: mt.name, price: mt.price };
        }
      }
    }

    // Build assignment lookup: member_id -> { coachId, saved }
    const assignmentMap: Record<
      string,
      { coachId: string; saved: boolean }
    > = {};
    for (const a of assignmentsRes.data ?? []) {
      assignmentMap[a.member_id] = {
        coachId: a.coach_id,
        saved: a.saved ?? false,
      };
    }

    // Build last-touch lookup: member_id -> latest created_at
    const lastTouchMap: Record<string, string> = {};
    for (const t of touchesRes.data ?? []) {
      if (!lastTouchMap[t.member_id]) {
        lastTouchMap[t.member_id] = t.created_at;
      }
    }

    // Transform DB members into Coach Accountability Member shape
    const members: Member[] = (membersRes.data ?? []).map((m) => {
      const mt = m.membership_type_id
        ? membershipTypesMap[m.membership_type_id]
        : undefined;
      const assignment = assignmentMap[m.id];

      return {
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        plan: mt?.name ?? "Standard",
        mrr: mt?.price != null ? Number(mt.price) : 0,
        status: deriveStatus(m.status, m.churn_risk_level),
        healthScore: deriveHealthScore(m.commitment_score, m.churn_risk_score),
        habitDecay: deriveHabitDecay(m.habit_decay_index, m.last_visit_date),
        reasons: deriveReasons(
          m.last_visit_date,
          m.emotional_disengagement_flags,
          m.churn_risk_level
        ),
        ownerCoachId: assignment?.coachId ?? "",
        lastTouchAt: lastTouchMap[m.id] ?? null,
        nextSessionAt: null,
        saved: assignment?.saved ?? false,
        lastVisitDate: m.last_visit_date ?? null,
      };
    });

    // Compute coach metrics from touches + members
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const coachMetrics = (coachesRes.data ?? []).map((c) => {
      const coachTouches = (touchesRes.data ?? []).filter((t) => t.coach_id === c.id);
      const touchesThisWeek = coachTouches.filter((t) => t.created_at >= weekAgo);
      const assignedMembers = (members ?? []).filter((m) => m.ownerCoachId === c.id);
      const atRiskAssigned = assignedMembers.filter((m) => m.status === "at_risk" || m.status === "slipping").length;
      const savedThisMonth = (assignmentsRes.data ?? []).filter(
        (a) => a.coach_id === c.id && a.saved
      ).length;
      const savedMembersForCoach = (members ?? []).filter(
        (m) => m.ownerCoachId === c.id && m.saved
      );
      const revenueRetained = savedMembersForCoach.reduce((sum, m) => sum + m.mrr, 0);

      return {
        coachId: c.id,
        membersAssignedCount: assignedMembers.length,
        atRiskAssignedCount: atRiskAssigned,
        contactedTodayCount: coachTouches.filter((t) => {
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          return t.created_at >= todayStart.toISOString();
        }).length,
        contactedThisWeekCount: touchesThisWeek.length,
        contactCoveragePct: atRiskAssigned > 0
          ? Math.min(100, Math.round((touchesThisWeek.length / Math.max(1, atRiskAssigned)) * 100))
          : 100,
        avgResponseTimeHours: 24,
        responseRatePct: 50,
        reengagementRatePct: savedThisMonth > 0 ? 20 : 0,
        saveRatePct: savedThisMonth > 0 ? 15 : 0,
        behaviourImprovementRatePct: 10,
        membersSavedThisMonth: savedThisMonth,
        revenueRetainedThisMonthGBP: revenueRetained,
        coachRetentionScore: 70,
        outreachStreakDays: touchesThisWeek.length > 0 ? 7 : 0,
      };
    });

    const atRiskMembers = (members ?? []).filter((m) => m.status === "at_risk" || m.status === "slipping");
    const revenueAtRisk = atRiskMembers.reduce((sum, m) => sum + m.mrr, 0);
    const totalSaved = (assignmentsRes.data ?? []).filter((a) => a.saved).length;
    const revenueRetained = (members ?? []).filter((m) => m.saved).reduce((sum, m) => sum + m.mrr, 0);
    const activeCount = (members ?? []).filter((m) => m.status === "stable" || m.status === "slipping" || m.status === "at_risk").length;
    const retentionRatePct = (members ?? []).length > 0
      ? Math.round((activeCount / (members ?? []).length) * 100)
      : 100;

    const teamMetrics = {
      revenueAtRiskGBP: revenueAtRisk,
      membersAtRiskCount: atRiskMembers.length,
      membersSavedThisMonth: totalSaved,
      revenueRetainedThisMonthGBP: revenueRetained,
      retentionRatePct,
    };

    // Transform DB users into Coach shape
    const coaches: Coach[] = (coachesRes.data ?? []).map((u) => ({
      id: u.id,
      name: u.full_name,
    }));

    // Transform DB touches into Touch shape
    const touches: Touch[] = (touchesRes.data ?? []).map((t) => ({
      id: t.id,
      memberId: t.member_id,
      coachId: t.coach_id,
      createdAt: t.created_at,
      channel: t.channel,
      type: t.type,
      outcome: t.outcome,
      notes: t.notes ?? undefined,
      playId: t.play_id ?? undefined,
    }));

    return successResponse({
      members,
      coaches,
      touches,
      coachMetrics,
      teamMetrics,
    });
  } catch (error) {
    return handleApiError(error, "Coach accountability data fetch error");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveStatus(
  dbStatus: string,
  churnRiskLevel: string | null
): MemberStatus {
  if (dbStatus === "cancelled") return "win_back";
  if (churnRiskLevel === "high") return "at_risk";
  if (churnRiskLevel === "medium") return "slipping";
  return "stable";
}

function deriveHealthScore(
  commitmentScore: number | null,
  churnRiskScore: number
): number {
  if (commitmentScore != null) return Math.round(Number(commitmentScore));
  return Math.max(0, 100 - churnRiskScore);
}

function deriveHabitDecay(
  habitDecayIndex: number | null,
  lastVisitDate: string | null
): HabitDecayLevel {
  if (habitDecayIndex != null) {
    const idx = Number(habitDecayIndex);
    if (idx >= 2.0) return 3;
    if (idx >= 1.0) return 2;
    return 1;
  }
  // Fallback: derive from days since last visit
  if (!lastVisitDate) return 3;
  const daysSince = Math.floor(
    (Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince >= 21) return 3;
  if (daysSince >= 10) return 2;
  return 1;
}

function deriveReasons(
  lastVisitDate: string | null,
  emotionalFlags: unknown,
  churnRiskLevel: string | null
): ReasonChip[] {
  const reasons: ReasonChip[] = [];

  // Attendance drop
  if (lastVisitDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 14) reasons.push("Attendance drop");
  } else {
    reasons.push("No bookings");
  }

  // Emotional disengagement flags
  if (emotionalFlags && typeof emotionalFlags === "object") {
    const flags = emotionalFlags as Record<string, unknown>;
    if (flags.payment_friction) reasons.push("Payment friction");
    if (flags.plateau || flags.flatlined) reasons.push("Plateau");
  }

  // If high risk with no specific reason yet, add a generic one
  if (reasons.length === 0 && churnRiskLevel === "high") {
    reasons.push("Attendance drop");
  }

  return reasons;
}
