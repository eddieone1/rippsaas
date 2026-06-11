import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDb, generateId } from "@/lib/interventions/db";
import { createPlaySchema } from "@/lib/interventions/validate";
import { requireApiAuth, ApiAuthError } from "@/lib/auth/guards";
import { requirePlanFeature } from "@/lib/auth/plan-guards";

export async function GET() {
  try {
    const { gymId } = await requireApiAuth();
    const db = getDb();
    const { data: plays, error } = await db
      .from("intervention_plays")
      .select("*")
      .eq("tenant_id", gymId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(plays);
  } catch (e) {
    if (e && typeof e === "object" && "status" in e) {
      const err = e as { message?: string; status: number };
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: err.status });
    }
    console.error("Plays GET", e);
    return NextResponse.json({ error: "Failed to list plays" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { gymId } = await requireApiAuth();
    const body = await request.json();
    const data = createPlaySchema.parse({ ...body, tenantId: undefined });

    try {
      if (data.channels?.includes("SMS")) {
        await requirePlanFeature(gymId, "sms_campaigns");
      }
    } catch (e) {
      if (e instanceof ApiAuthError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }

    // Ensure intervention tenant exists (required for FK; created on first play)
    const admin = createAdminClient();
    const { data: gym } = await admin.from("gyms").select("name").eq("id", gymId).single();
    const gymName = gym?.name ?? "Gym";
    await admin
      .from("intervention_tenants")
      .upsert(
        { id: gymId, name: gymName, timezone: "Europe/London" },
        { onConflict: "id" }
      );

    const db = getDb();
    const { data: play, error } = await db
      .from("intervention_plays")
      .insert({
        id: generateId(),
        tenant_id: gymId,
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
    if (e && typeof e === "object" && "status" in e) {
      const err = e as { message?: string; status: number };
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: err.status });
    }
    if (e instanceof Error && "issues" in e) {
      return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
    }
    console.error("Plays POST", e);
    return NextResponse.json({ error: "Failed to create play" }, { status: 500 });
  }
}
