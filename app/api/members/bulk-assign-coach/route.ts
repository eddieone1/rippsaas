import { NextResponse } from "next/server";
import { requireAction } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  memberIds: z.array(z.string().uuid()).min(1).max(100),
  coachId: z.string().uuid(),
});

/**
 * POST /api/members/bulk-assign-coach
 * Assign a coach to multiple members at once
 */
export async function POST(request: Request) {
  try {
    const { userProfile, gymId } = await requireAction("invite_users");
    const body = await request.json();
    const { memberIds, coachId } = schema.parse(body);

    const adminClient = createAdminClient();

    const { data: coach } = await adminClient
      .from("users")
      .select("id")
      .eq("id", coachId)
      .eq("gym_id", gymId)
      .eq("role", "coach")
      .single();

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const { data: members } = await adminClient
      .from("members")
      .select("id")
      .eq("gym_id", gymId)
      .in("id", memberIds);

    const validIds = members?.map((m) => m.id) ?? [];
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid members found" }, { status: 400 });
    }

    for (const memberId of validIds) {
      await adminClient.from("member_coaches").delete().eq("member_id", memberId);
      await adminClient.from("member_coaches").insert({
        member_id: memberId,
        coach_id: coachId,
        assigned_by: userProfile.id,
      });
    }

    return NextResponse.json({
      success: true,
      assigned: validIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("Bulk assign coach error:", error);
    return NextResponse.json({ error: "Failed to assign coach" }, { status: 500 });
  }
}
