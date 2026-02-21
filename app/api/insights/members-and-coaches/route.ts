import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";
import { handleApiError } from "@/lib/api/response";
import { calculateCommitmentScore } from "@/lib/commitment-score";
import { differenceInDays, format, parseISO, subDays } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * GET /api/insights/members-and-coaches
 * Returns member-focused insights (best/worst performers) and coach performance metrics.
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");
    const todayStr = format(now, "yyyy-MM-dd");

    // Members with visit data
    const { data: members } = await supabase
      .from("members")
      .select("id, first_name, last_name, email, joined_date, last_visit_date, churn_risk_level, commitment_score")
      .eq("gym_id", gymId)
      .eq("status", "active");

    const memberIds = members?.map((m) => m.id) ?? [];
    let visitCountByMember: Map<string, number> = new Map();
    if (memberIds.length > 0) {
      const { data: activities } = await adminClient
        .from("member_activities")
        .select("member_id")
        .eq("activity_type", "visit")
        .in("member_id", memberIds)
        .gte("activity_date", thirtyDaysAgoStr)
        .lte("activity_date", todayStr);
      (activities ?? []).forEach((a: { member_id: string }) => {
        visitCountByMember.set(a.member_id, (visitCountByMember.get(a.member_id) ?? 0) + 1);
      });
    }

    const visitDatesByMember = new Map<string, string[]>();
    if (memberIds.length > 0) {
      const { data: allActivities } = await adminClient
        .from("member_activities")
        .select("member_id, activity_date")
        .eq("activity_type", "visit")
        .in("member_id", memberIds);
      (allActivities ?? []).forEach((a: { member_id: string; activity_date: string }) => {
        const list = visitDatesByMember.get(a.member_id) ?? [];
        list.push(a.activity_date);
        visitDatesByMember.set(a.member_id, list);
      });
    }

    const memberScores = (members ?? []).map((m: any) => {
      const visits = visitCountByMember.get(m.id) ?? 0;
      const visitDates = visitDatesByMember.get(m.id) ?? [];
      const stored = m.commitment_score;
      let commitmentScore = stored;
      if (typeof stored !== "number" || stored < 0 || stored > 100) {
        const result = calculateCommitmentScore({
          joinedDate: m.joined_date,
          lastVisitDate: m.last_visit_date,
          visitDates,
          expectedVisitsPerWeek: 2,
        });
        commitmentScore = result.score;
      }
      const daysSinceLastVisit = m.last_visit_date
        ? differenceInDays(now, parseISO(m.last_visit_date))
        : null;
      return {
        id: m.id,
        name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown",
        email: m.email ?? null,
        visitsLast30Days: visits,
        commitmentScore,
        churnRiskLevel: m.churn_risk_level || "none",
        daysSinceLastVisit,
      };
    });

    const bestMembers = [...memberScores]
      .filter((m) => m.visitsLast30Days > 0)
      .sort((a, b) => b.visitsLast30Days - a.visitsLast30Days)
      .slice(0, 10);

    const worstMembers = [...memberScores]
      .filter((m) => m.churnRiskLevel === "high" || m.churnRiskLevel === "medium" || (m.daysSinceLastVisit !== null && m.daysSinceLastVisit > 14))
      .sort((a, b) => {
        if (a.churnRiskLevel === "high" && b.churnRiskLevel !== "high") return -1;
        if (a.churnRiskLevel !== "high" && b.churnRiskLevel === "high") return 1;
        const aDays = a.daysSinceLastVisit ?? 0;
        const bDays = b.daysSinceLastVisit ?? 0;
        return bDays - aDays;
      })
      .slice(0, 10);

    // Coach performance
    const { data: usersInGym } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("gym_id", gymId)
      .not("full_name", "is", null);

    const coachIds = usersInGym?.map((u) => u.id) ?? [];
    const coachTouchesMap = new Map<string, number>();
    const coachAtRiskMap = new Map<string, number>();

    if (coachIds.length > 0) {
      const { data: touches } = await adminClient
        .from("coach_touches")
        .select("coach_id")
        .eq("gym_id", gymId)
        .gte("created_at", thirtyDaysAgo.toISOString());
      (touches ?? []).forEach((t: { coach_id: string }) => {
        coachTouchesMap.set(t.coach_id, (coachTouchesMap.get(t.coach_id) ?? 0) + 1);
      });

      const { data: assignments } = await supabase
        .from("member_coaches")
        .select("coach_id, member_id")
        .eq("gym_id", gymId);
      const { data: atRiskMembers } = await supabase
        .from("members")
        .select("id")
        .eq("gym_id", gymId)
        .in("churn_risk_level", ["high", "medium"]);
      const atRiskIds = new Set(atRiskMembers?.map((m) => m.id) ?? []);
      const assignmentToCoach = new Map<string, string>();
      (assignments ?? []).forEach((a: { coach_id: string; member_id: string }) => {
        assignmentToCoach.set(a.member_id, a.coach_id);
      });
      atRiskIds.forEach((memberId) => {
        const coachId = assignmentToCoach.get(memberId);
        if (coachId) {
          coachAtRiskMap.set(coachId, (coachAtRiskMap.get(coachId) ?? 0) + 1);
        }
      });
    }

    const coachPerformance = (usersInGym ?? []).map((c: any) => ({
      coachId: c.id,
      name: c.full_name || "Unknown",
      touchesLast30Days: coachTouchesMap.get(c.id) ?? 0,
      atRiskAssigned: coachAtRiskMap.get(c.id) ?? 0,
    })).sort((a: { touchesLast30Days: number }, b: { touchesLast30Days: number }) => b.touchesLast30Days - a.touchesLast30Days);

    return Response.json({
      bestMembers,
      worstMembers,
      coachPerformance,
    });
  } catch (error) {
    return handleApiError(error, "Members and coaches insights");
  }
}
