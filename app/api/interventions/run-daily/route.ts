import { NextResponse } from "next/server";
import { runDailyForTenant } from "@/lib/interventions/engine";
import { runDailyQuerySchema } from "@/lib/interventions/validate";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = runDailyQuerySchema.parse({
      tenantId: searchParams.get("tenantId") ?? process.env.INTERVENTIONS_DEMO_TENANT_ID ?? "demo-tenant",
    });
    const result = await runDailyForTenant(query.tenantId);
    return NextResponse.json(result);
  } catch (e) {
    if (e && typeof e === "object" && "issues" in e) {
      return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
    }
    console.error("Run daily", e);
    return NextResponse.json({ error: "Daily run failed" }, { status: 500 });
  }
}
