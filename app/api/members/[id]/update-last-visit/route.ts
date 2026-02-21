import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api/response";
import { calculateChurnRisk } from "@/lib/churn-risk";
import { calculateCommitmentScore } from "@/lib/commitment-score";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;

    const { last_visit_date } = await request.json();

    if (!last_visit_date) {
      return errorResponse("last_visit_date is required", 400);
    }

    // Get member to recalculate risk and verify it belongs to user's gym
    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .eq("gym_id", gymId)
      .single();

    if (!member) {
      return errorResponse("Member not found", 404);
    }

    // Get visit history for commitment score calculation
    const { data: visitActivities } = await supabase
      .from("member_activities")
      .select("activity_date")
      .eq("member_id", memberId)
      .eq("activity_type", "visit")
      .order("activity_date", { ascending: false });

    const visitDates = visitActivities?.map((a) => a.activity_date) || [];
    if (last_visit_date && !visitDates.includes(last_visit_date)) {
      visitDates.unshift(last_visit_date);
    }

    // Calculate commitment score
    const commitmentResult = calculateCommitmentScore({
      joinedDate: member.joined_date,
      lastVisitDate: last_visit_date,
      visitDates,
      expectedVisitsPerWeek: 2, // Default assumption
    });

    // Recalculate churn risk based on commitment score
    const riskResult = calculateChurnRisk({
      last_visit_date,
      joined_date: member.joined_date,
      commitment_score: commitmentResult.score,
    });

    // Record member activity for intervention tracking
    await supabase.from("member_activities").insert({
      member_id: memberId,
      activity_date: last_visit_date,
      activity_type: "visit",
    });

    // Update member
    const { error } = await supabase
      .from("members")
      .update({
        last_visit_date,
        commitment_score: commitmentResult.score,
        commitment_score_calculated_at: new Date().toISOString(),
        churn_risk_score: riskResult.score,
        churn_risk_level: riskResult.level,
        last_risk_calculated_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", memberId);

    if (error) {
      return errorResponse(`Failed to update member: ${error.message}`, 500);
    }

    // Trigger outcome calculation for interventions (background, non-blocking)
    // MVP: Fire and forget - outcomes will be recalculated when user views insights
    fetch("/api/interventions/calculate-outcomes", {
      method: "POST",
    }).catch((err) => {
      console.error("Failed to trigger outcome calculation:", err);
    });

    return successResponse();
  } catch (error) {
    return handleApiError(error, "Update last visit error");
  }
}
