import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api/response";

/**
 * POST /api/coach-accountability/mark-saved
 *
 * Toggle the "saved" flag on a member's coach assignment.
 * Body: { memberId, saved: boolean }
 */
export async function POST(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { memberId, saved } = await request.json();
    if (!memberId || typeof saved !== "boolean") {
      return errorResponse("memberId (string) and saved (boolean) are required", 400);
    }

    const { error } = await supabase
      .from("member_coaches")
      .update({ saved })
      .eq("member_id", memberId)
      .eq("gym_id", gymId);

    if (error) {
      return errorResponse(`Failed to update saved status: ${error.message}`, 500);
    }

    return successResponse({ memberId, saved });
  } catch (error) {
    return handleApiError(error, "Mark saved error");
  }
}
