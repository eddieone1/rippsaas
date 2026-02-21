import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateChurnRisk } from "@/lib/churn-risk";

/**
 * POST /api/members/recalculate-risk
 * 
 * Recalculates churn risk scores and levels for all active/inactive members
 * using the new recalibrated risk scoring system.
 * 
 * This endpoint can be called to apply the new risk scoring logic to existing data.
 */
export async function POST() {
  try {
    const { gymId } = await requireAuth();
    const adminClient = createAdminClient();

    // Fetch all active and inactive members for this gym
    const { data: members, error: fetchError } = await adminClient
      .from("members")
      .select("id, commitment_score, last_visit_date, joined_date")
      .eq("gym_id", gymId)
      .in("status", ["active", "inactive"]);

    if (fetchError) {
      console.error("Error fetching members:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        message: "No members found to update",
        updated: 0,
      });
    }

    // Recalculate risk for each member
    const updates = members.map((member) => {
      const riskResult = calculateChurnRisk({
        last_visit_date: member.last_visit_date,
        joined_date: member.joined_date,
        commitment_score: member.commitment_score ?? null,
      });

      return {
        id: member.id,
        churn_risk_level: riskResult.level,
        churn_risk_score: riskResult.score,
      };
    });

    // Batch update members
    let updatedCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await adminClient
        .from("members")
        .update({
          churn_risk_level: update.churn_risk_level,
          churn_risk_score: update.churn_risk_score,
        })
        .eq("id", update.id);

      if (updateError) {
        console.error(`Error updating member ${update.id}:`, updateError);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: "Risk scores recalculated",
      total: members.length,
      updated: updatedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Recalculate risk error:", error);
    return NextResponse.json(
      { error: "Failed to recalculate risk scores" },
      { status: 500 }
    );
  }
}
