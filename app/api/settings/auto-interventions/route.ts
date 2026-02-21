import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api/response";

/**
 * GET /api/settings/auto-interventions
 *
 * Returns the current state of the auto-interventions toggle.
 */
export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { data: gym, error } = await supabase
      .from("gyms")
      .select("auto_interventions_enabled")
      .eq("id", gymId)
      .single();

    if (error || !gym) {
      return errorResponse("Gym not found", 404);
    }

    return successResponse({
      enabled: gym.auto_interventions_enabled ?? false,
    });
  } catch (error) {
    return handleApiError(error, "Get auto-interventions setting error");
  }
}

/**
 * POST /api/settings/auto-interventions
 *
 * Toggle auto-interventions on or off.
 * Body: { enabled: boolean }
 */
export async function POST(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { enabled } = await request.json();
    if (typeof enabled !== "boolean") {
      return errorResponse("enabled (boolean) is required", 400);
    }

    const { error } = await supabase
      .from("gyms")
      .update({ auto_interventions_enabled: enabled })
      .eq("id", gymId);

    if (error) {
      return errorResponse(
        `Failed to update setting: ${error.message}`,
        500
      );
    }

    return successResponse({ enabled });
  } catch (error) {
    return handleApiError(error, "Toggle auto-interventions error");
  }
}
