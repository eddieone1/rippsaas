import { NextResponse } from "next/server";
import { getDb } from "@/lib/interventions/db";
import { updatePlaySchema } from "@/lib/interventions/validate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { data: play, error } = await db
      .from("intervention_plays")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!play) return NextResponse.json({ error: "Play not found" }, { status: 404 });

    // Get intervention count for this play
    const { count } = await db
      .from("intervention_interventions")
      .select("*", { count: "exact", head: true })
      .eq("play_id", id);

    return NextResponse.json({ ...play, _count: { interventions: count ?? 0 } });
  } catch (e) {
    console.error("Play GET", e);
    return NextResponse.json({ error: "Failed to get play" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updatePlaySchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.triggerType !== undefined) updateData.trigger_type = data.triggerType;
    if (data.minRiskScore !== undefined) updateData.min_risk_score = data.minRiskScore;
    if (data.channels !== undefined) updateData.channels = data.channels;
    if (data.requiresApproval !== undefined) updateData.requires_approval = data.requiresApproval;
    if (data.quietHoursStart !== undefined) updateData.quiet_hours_start = data.quietHoursStart;
    if (data.quietHoursEnd !== undefined) updateData.quiet_hours_end = data.quietHoursEnd;
    if (data.maxMessagesPerMemberPerWeek !== undefined) updateData.max_messages_per_member_per_week = data.maxMessagesPerMemberPerWeek;
    if (data.cooldownDays !== undefined) updateData.cooldown_days = data.cooldownDays;
    if (data.templateSubject !== undefined) updateData.template_subject = data.templateSubject;
    if (data.templateBody !== undefined) updateData.template_body = data.templateBody;

    const db = getDb();
    const { data: play, error } = await db
      .from("intervention_plays")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!play) return NextResponse.json({ error: "Play not found" }, { status: 404 });
    return NextResponse.json(play);
  } catch (e) {
    if (e && typeof e === "object" && "issues" in e) {
      return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
    }
    console.error("Play PATCH", e);
    return NextResponse.json({ error: "Failed to update play" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { error, count } = await db
      .from("intervention_plays")
      .delete()
      .eq("id", id);

    if (error) throw error;
    if (count === 0) return NextResponse.json({ error: "Play not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Play DELETE", e);
    return NextResponse.json({ error: "Failed to delete play" }, { status: 500 });
  }
}
