import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api/response";

/**
 * POST /api/coach-accountability/touches
 *
 * Log a new coach touch (interaction) for a member.
 * Body: { memberId, coachId, channel, type, outcome, notes?, playId? }
 */
export async function POST(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { memberId, coachId, channel, type, outcome, notes, playId } = body;

    if (!memberId || !coachId || !channel || !outcome) {
      return errorResponse(
        "memberId, coachId, channel, and outcome are required",
        400
      );
    }

    // Duplicate detection: same member/channel/outcome within 2 hours
    const twoHoursAgo = new Date(
      Date.now() - 2 * 60 * 60 * 1000
    ).toISOString();
    const { data: existing } = await supabase
      .from("coach_touches")
      .select("id")
      .eq("member_id", memberId)
      .eq("channel", channel)
      .eq("outcome", outcome)
      .eq("gym_id", gymId)
      .gte("created_at", twoHoursAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return errorResponse(
        "Duplicate touch blocked (same member/channel/outcome within 2 hours)",
        409
      );
    }

    const { data: touch, error } = await supabase
      .from("coach_touches")
      .insert({
        member_id: memberId,
        coach_id: coachId,
        gym_id: gymId,
        channel,
        type: type ?? "coach",
        outcome,
        notes: notes ?? null,
        play_id: playId ?? null,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(`Failed to log touch: ${error.message}`, 500);
    }

    return successResponse({
      id: touch.id,
      memberId: touch.member_id,
      coachId: touch.coach_id,
      createdAt: touch.created_at,
      channel: touch.channel,
      type: touch.type,
      outcome: touch.outcome,
      notes: touch.notes ?? undefined,
      playId: touch.play_id ?? undefined,
    });
  } catch (error) {
    return handleApiError(error, "Log touch error");
  }
}
