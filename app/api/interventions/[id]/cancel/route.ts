import { NextResponse } from "next/server";
import { cancelIntervention } from "@/lib/interventions/engine";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await cancelIntervention(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Cancel intervention", e);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
