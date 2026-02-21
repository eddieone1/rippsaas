import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";
import { handleApiError } from "@/lib/api/response";
import {
  MEMBER_STAGES,
  MEMBER_STAGE_LABELS,
  MEMBER_STAGE_PLAYS,
  getMemberStage,
} from "@/lib/member-intelligence";
import { calculateCommitmentScore } from "@/lib/commitment-score";
import { calculateChurnRisk } from "@/lib/churn-risk";
import { differenceInDays, format, parseISO, subDays } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * GET /api/insights/members-by-stage?stage=momentum_identity
 * Returns members in the specified stage with behaviour interpretation.
 */
export async function GET(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    if (!stage || !(MEMBER_STAGES as readonly string[]).includes(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }

    const { data: membersForStages } = await supabase
      .from("members")
      .select("id, first_name, last_name, email, status, joined_date, last_visit_date, churn_risk_score, churn_risk_level, member_stage")
      .eq("gym_id", gymId);

    const memberIds = membersForStages?.map((m) => m.id) ?? [];
    const visitDatesByMember = new Map<string, string[]>();
    if (memberIds.length > 0) {
      const { data: activities } = await adminClient
        .from("member_activities")
        .select("member_id, activity_date")
        .in("member_id", memberIds)
        .eq("activity_type", "visit")
        .limit(10000);
      (activities ?? []).forEach((a: { member_id: string; activity_date: string }) => {
        const list = visitDatesByMember.get(a.member_id) ?? [];
        const d = typeof a.activity_date === "string" ? a.activity_date.slice(0, 10) : "";
        if (d) list.push(d);
        visitDatesByMember.set(a.member_id, list);
      });
    }

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const thirtyDaysAgoStr = format(subDays(today, 30), "yyyy-MM-dd");

    const membersInStage: Array<{
      id: string;
      name: string;
      email: string | null;
      commitmentScore: number;
      churnRiskLevel: string;
      daysSinceLastVisit: number | null;
    }> = [];

    membersForStages?.forEach((m: any) => {
      const storedStage = m.member_stage?.trim();
      let resolvedStage: string;
      if (storedStage && (MEMBER_STAGES as readonly string[]).includes(storedStage)) {
        resolvedStage = storedStage;
      } else {
        const visitDates = visitDatesByMember.get(m.id) ?? [];
        const commitmentResult = calculateCommitmentScore({
          joinedDate: m.joined_date,
          lastVisitDate: m.last_visit_date,
          visitDates,
          expectedVisitsPerWeek: 2,
        });
        const visitsLast30Days = visitDates.filter((d) => {
          const ds = (d || "").slice(0, 10);
          return ds >= thirtyDaysAgoStr && ds <= todayStr;
        }).length;
        const churnResult = calculateChurnRisk({
          last_visit_date: m.last_visit_date,
          joined_date: m.joined_date,
          commitment_score: commitmentResult.score,
        });
        const daysSinceJoined = differenceInDays(today, parseISO(m.joined_date));
        const daysSinceLastVisit = m.last_visit_date
          ? differenceInDays(today, parseISO(m.last_visit_date))
          : null;
        resolvedStage = getMemberStage({
          status: m.status,
          churnRiskScore: churnResult.score,
          churnRiskLevel: churnResult.level,
          commitmentScore: commitmentResult.score,
          habitDecayVelocity: commitmentResult.habitDecayVelocity,
          daysSinceJoined,
          daysSinceLastVisit,
          visitsLast30Days,
          riskFlags: commitmentResult.riskFlags,
          attendanceDecayScore: commitmentResult.factorScores.attendanceDecay,
        });
      }
      if (resolvedStage !== stage) return;

      const visitDates = visitDatesByMember.get(m.id) ?? [];
      const commitmentResult = calculateCommitmentScore({
        joinedDate: m.joined_date,
        lastVisitDate: m.last_visit_date,
        visitDates,
        expectedVisitsPerWeek: 2,
      });
      const daysSinceLastVisit = m.last_visit_date
        ? differenceInDays(today, parseISO(m.last_visit_date))
        : null;

      membersInStage.push({
        id: m.id,
        name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown",
        email: m.email ?? null,
        commitmentScore: commitmentResult.score,
        churnRiskLevel: m.churn_risk_level || "none",
        daysSinceLastVisit,
      });
    });

    const label = (MEMBER_STAGE_LABELS as Record<string, string>)[stage] ?? stage;
    const play = (MEMBER_STAGE_PLAYS as Record<string, string>)[stage] ?? "";

    // Generic behaviour interpretation per stage
    const behaviourByStage: Record<string, string> = {
      onboarding_vulnerability: "New members in their first 30 days. They're forming initial habits and need extra support to lock in attendance.",
      habit_formation: "Members building consistency. They're establishing routines and respond well to fixed class times and accountability.",
      momentum_identity: "Engaged members with strong habits. Reinforce their identity as gym-goers; celebrate streaks and consistency.",
      plateau_boredom_risk: "Members who may be losing motivation. Consider new goals, challenges, or varying their routine.",
      emotional_disengagement: "Members pulling back. Personal 1:1 touchpoints can help understand what would make the gym feel essential again.",
      at_risk_silent_quit: "High churn risk. Prioritise outreach before they slip away; personalised message or call recommended.",
      win_back_window: "Lapsed members with potential to return. Win-back campaign, we-miss-you message or incentive can bring them back.",
      churned: "Members who have left. Optional win-back if they left on good terms; otherwise respect the exit.",
    };
    const behaviourInterpretation = behaviourByStage[stage] ?? "Members in this stage share common behavioural patterns.";

    return Response.json({
      stage,
      label,
      play,
      behaviourInterpretation,
      members: membersInStage,
      count: membersInStage.length,
    });
  } catch (error) {
    return handleApiError(error, "Members by stage");
  }
}
