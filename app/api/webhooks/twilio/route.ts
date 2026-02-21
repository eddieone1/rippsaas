import { NextResponse } from "next/server";
import { getDb, generateId } from "@/lib/interventions/db";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const messageSid = formData.get("MessageSid") as string | null;
    const messageStatus = formData.get("MessageStatus") as string | null;
    const smsSid = formData.get("SmsSid") as string | null;
    const sid = messageSid ?? smsSid;
    if (!sid) {
      return NextResponse.json({ error: "Missing MessageSid/SmsSid" }, { status: 400 });
    }

    const db = getDb();

    const { data: intervention } = await db
      .from("intervention_interventions")
      .select("id")
      .eq("provider_message_id", sid)
      .maybeSingle();

    if (!intervention) {
      return NextResponse.json({ ok: true });
    }

    const payload = Object.fromEntries(formData.entries());
    if (messageStatus === "delivered" || messageStatus === "sent") {
      await db
        .from("intervention_interventions")
        .update({ status: "DELIVERED" })
        .eq("id", intervention.id);

      await db.from("intervention_message_events").insert({
        id: generateId(),
        intervention_id: intervention.id,
        type: "DELIVERED",
        payload: payload as object,
      });
    } else if (messageStatus === "failed" || messageStatus === "undelivered") {
      await db
        .from("intervention_interventions")
        .update({ status: "FAILED" })
        .eq("id", intervention.id);

      await db.from("intervention_message_events").insert({
        id: generateId(),
        intervention_id: intervention.id,
        type: "FAILED",
        payload: payload as object,
      });
    }

    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (e) {
    console.error("Twilio webhook", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
