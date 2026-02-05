import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateChurnRisk } from "@/lib/churn-risk";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;

    const { last_visit_date } = await request.json();

    if (!last_visit_date) {
      return NextResponse.json(
        { error: "last_visit_date is required" },
        { status: 400 }
      );
    }

    // Get user's gym_id
    const { data: userProfile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id) {
      return NextResponse.json(
        { error: "Gym not found" },
        { status: 404 }
      );
    }

    // Get member to recalculate risk and verify it belongs to user's gym
    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .eq("gym_id", userProfile.gym_id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get visit frequency for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: visitsLast30Days } = await supabase
      .from("member_activities")
      .select("*", { count: "exact", head: true })
      .eq("member_id", memberId)
      .gte("activity_date", thirtyDaysAgo.toISOString().split("T")[0]);

    // Recalculate churn risk with all available factors
    const riskResult = calculateChurnRisk({
      last_visit_date,
      joined_date: member.joined_date,
      has_received_campaign: false,
      distance_from_gym_km: (member as any).distance_from_gym_km || null,
      age: (member as any).age || null,
      employment_status: (member as any).employment_status || null,
      student_status: (member as any).student_status || null,
      visits_last_30_days: visitsLast30Days || 0,
      total_visits: (member as any).total_visits || null,
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
        churn_risk_score: riskResult.score,
        churn_risk_level: riskResult.level,
        last_risk_calculated_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update member: ${error.message}` },
        { status: 500 }
      );
    }

    // Trigger outcome calculation for interventions (background, non-blocking)
    // MVP: Fire and forget - outcomes will be recalculated when user views insights
    fetch("/api/interventions/calculate-outcomes", {
      method: "POST",
    }).catch((err) => {
      console.error("Failed to trigger outcome calculation:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update last visit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
