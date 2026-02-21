import { NextResponse } from "next/server";
import { getDb, generateId } from "@/lib/interventions/db";
import { createPlaySchema } from "@/lib/interventions/validate";

const DEMO_TENANT_ID = process.env.INTERVENTIONS_DEMO_TENANT_ID ?? "demo-tenant";

export async function GET() {
  try {
    const db = getDb();
    const { data: plays, error } = await db
      .from("intervention_plays")
      .select("*")
      .eq("tenant_id", DEMO_TENANT_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(plays);
  } catch (e) {
    console.error("Plays GET", e);
    return NextResponse.json({ error: "Failed to list plays" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createPlaySchema.parse({ ...body, tenantId: undefined });

    const db = getDb();
    const { data: play, error } = await db
      .from("intervention_plays")
      .insert({
        id: generateId(),
        tenant_id: DEMO_TENANT_ID,
        name: data.name,
        description: data.description ?? null,
        is_active: data.isActive,
        trigger_type: data.triggerType,
        min_risk_score: data.minRiskScore,
        channels: data.channels,
        requires_approval: data.requiresApproval,
        quiet_hours_start: data.quietHoursStart,
        quiet_hours_end: data.quietHoursEnd,
        max_messages_per_member_per_week: data.maxMessagesPerMemberPerWeek,
        cooldown_days: data.cooldownDays,
        template_subject: data.templateSubject ?? null,
        template_body: data.templateBody,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(play);
  } catch (e) {
    if (e instanceof Error && "issues" in e) {
      return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
    }
    console.error("Plays POST", e);
    return NextResponse.json({ error: "Failed to create play" }, { status: 500 });
  }
}
