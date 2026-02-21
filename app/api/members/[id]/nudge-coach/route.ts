import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/members/[id]/nudge-coach
 *
 * Sends a nudge/reminder to the assigned coach about this member.
 * For now, we store a simple audit; can expand to email/Slack later.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { gymId } = await requireApiAuth();
    const { id: memberId } = await Promise.resolve(params);

    const supabase = await createClient();

    const { data: assignment } = await supabase
      .from("member_coaches")
      .select("coach_id")
      .eq("member_id", memberId)
      .eq("gym_id", gymId)
      .maybeSingle();

    if (!assignment?.coach_id) {
      return NextResponse.json({ error: "No coach assigned to this member" }, { status: 400 });
    }

    // Nudge placeholder: could send email, create notification, etc.
    return NextResponse.json({
      success: true,
      message: "Nudge sent to coach",
    });
  } catch (error) {
    const { handleApiError } = await import("@/lib/api/response");
    return handleApiError(error, "Nudge coach");
  }
}
