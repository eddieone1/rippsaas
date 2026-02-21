import { NextResponse } from "next/server";
import { approveAndSend } from "@/lib/interventions/engine";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await approveAndSend(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Approve intervention", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Approve failed" },
      { status: 400 }
    );
  }
}
