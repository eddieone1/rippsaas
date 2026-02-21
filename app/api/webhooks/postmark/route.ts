import { NextResponse } from "next/server";
import { getDb, generateId } from "@/lib/interventions/db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      MessageID?: string;
      RecordType?: string;
      DeliveryRecipient?: string;
    };
    const messageId = body.MessageID;
    if (!messageId) {
      return NextResponse.json({ error: "Missing MessageID" }, { status: 400 });
    }

    const db = getDb();

    const { data: intervention } = await db
      .from("intervention_interventions")
      .select("id")
      .eq("provider_message_id", messageId)
      .maybeSingle();

    if (!intervention) {
      return NextResponse.json({ ok: true });
    }

    const recordType = body.RecordType ?? "";
    if (recordType === "Delivery" || recordType === "Open") {
      await db
        .from("intervention_interventions")
        .update({ status: "DELIVERED" })
        .eq("id", intervention.id);

      await db.from("intervention_message_events").insert({
        id: generateId(),
        intervention_id: intervention.id,
        type: "DELIVERED",
        payload: body as object,
      });
    } else if (recordType === "Bounce" || recordType === "SpamComplaint") {
      await db
        .from("intervention_interventions")
        .update({ status: "FAILED" })
        .eq("id", intervention.id);

      await db.from("intervention_message_events").insert({
        id: generateId(),
        intervention_id: intervention.id,
        type: "FAILED",
        payload: body as object,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Postmark webhook", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
