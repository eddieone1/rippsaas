import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCommitmentScore } from "@/lib/commitment-score";
import { requireApiAuth } from "@/lib/auth/guards";
import { NextResponse } from "next/server";

/**
 * GET /api/members/top-members
 * Returns top 5 members by commitment score / habit strength (most consistent, best habit formation).
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: members } = await supabase
      .from("members")
      .select("id, first_name, last_name, email, joined_date, last_visit_date, commitment_score")
      .eq("gym_id", gymId)
      .eq("status", "active");

    if (!members || members.length === 0) {
      return NextResponse.json({ topMembers: [] });
    }

    const memberIds = members.map((m) => m.id);
    const { data: allVisitActivities } = await adminClient
      .from("member_activities")
      .select("member_id, activity_date")
      .eq("activity_type", "visit")
      .in("member_id", memberIds)
      .order("activity_date", { ascending: false });

    const visitDatesByMember = new Map<string, string[]>();
    allVisitActivities?.forEach((a) => {
      if (!visitDatesByMember.has(a.member_id)) {
        visitDatesByMember.set(a.member_id, []);
      }
      visitDatesByMember.get(a.member_id)!.push(a.activity_date);
    });

    const scored = members.map((m) => {
      const stored = (m as { commitment_score?: number | null }).commitment_score;
      let score: number;
      if (typeof stored === "number" && stored >= 0 && stored <= 100) {
        score = stored;
      } else {
        const visitDates = visitDatesByMember.get(m.id) ?? [];
        const result = calculateCommitmentScore({
          joinedDate: m.joined_date,
          lastVisitDate: m.last_visit_date,
          visitDates,
          expectedVisitsPerWeek: 2,
        });
        score = result.score;
      }
      return {
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        email: m.email,
        commitmentScore: score,
      };
    });

    const topMembers = scored
      .filter((m) => m.commitmentScore >= 50)
      .sort((a, b) => b.commitmentScore - a.commitmentScore)
      .slice(0, 5);

    return NextResponse.json({ topMembers });
  } catch (error) {
    const { handleApiError } = await import("@/lib/api/response");
    return handleApiError(error, "Top members");
  }
}
