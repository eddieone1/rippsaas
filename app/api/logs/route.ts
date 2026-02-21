import { NextResponse } from "next/server";
import { getDb } from "@/lib/interventions/db";
import { logsQuerySchema } from "@/lib/interventions/validate";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = logsQuerySchema.parse({
      tenantId: searchParams.get("tenantId") ?? process.env.INTERVENTIONS_DEMO_TENANT_ID ?? "demo-tenant",
      memberId: searchParams.get("memberId") ?? undefined,
      channel: searchParams.get("channel") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const db = getDb();

    // Build query for interventions with related data
    let interventionsQuery = db
      .from("intervention_interventions")
      .select(
        "*, play:intervention_plays(name), member:intervention_members(first_name, last_name, email, phone), events:intervention_message_events(*)",
        { count: "exact" }
      )
      .eq("tenant_id", query.tenantId)
      .order("created_at", { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (query.memberId) interventionsQuery = interventionsQuery.eq("member_id", query.memberId);
    if (query.channel) interventionsQuery = interventionsQuery.eq("channel", query.channel);
    if (query.status) interventionsQuery = interventionsQuery.eq("status", query.status);
    if (query.from) interventionsQuery = interventionsQuery.gte("created_at", query.from);
    if (query.to) interventionsQuery = interventionsQuery.lte("created_at", query.to);

    const { data: interventions, count: total, error } = await interventionsQuery;

    if (error) throw error;

    return NextResponse.json({ interventions: interventions ?? [], total: total ?? 0 });
  } catch (e) {
    if (e && typeof e === "object" && "issues" in e) {
      return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
    }
    console.error("Logs GET", e);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
