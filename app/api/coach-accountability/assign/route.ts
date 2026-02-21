import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api/response";

/**
 * POST /api/coach-accountability/assign
 *
 * Assign (or reassign) a coach to a member.
 * Body: { memberId, coachId }
 *
 * Also supports bulk auto-assign:
 * Body: { assignments: [{ memberId, coachId }] }
 */
export async function POST(request: Request) {
  try {
    const { gymId, userProfile } = await requireApiAuth();
    const supabase = await createClient();

    const body = await request.json();

    // Bulk auto-assign
    if (Array.isArray(body.assignments)) {
      const rows = body.assignments.map(
        (a: { memberId: string; coachId: string }) => ({
          member_id: a.memberId,
          coach_id: a.coachId,
          gym_id: gymId,
          assigned_by: userProfile.id,
        })
      );

      const { error } = await supabase
        .from("member_coaches")
        .upsert(rows, { onConflict: "member_id" });

      if (error) {
        return errorResponse(`Failed to auto-assign: ${error.message}`, 500);
      }

      return successResponse({ assigned: rows.length });
    }

    // Single assignment
    const { memberId, coachId } = body;
    if (!memberId || !coachId) {
      return errorResponse("memberId and coachId are required", 400);
    }

    const { error } = await supabase.from("member_coaches").upsert(
      {
        member_id: memberId,
        coach_id: coachId,
        gym_id: gymId,
        assigned_by: userProfile.id,
      },
      { onConflict: "member_id" }
    );

    if (error) {
      return errorResponse(
        `Failed to assign coach: ${error.message}`,
        500
      );
    }

    return successResponse({ memberId, coachId });
  } catch (error) {
    return handleApiError(error, "Assign coach error");
  }
}
