import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.RESEND_FROM_EMAIL || "support@rip.app";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const subject = `Support: ${(name as string).slice(0, 50)}`;
    const html = `
      <h2>New support message</h2>
      <p><strong>From:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `;

    const { error } = await sendEmail({
      to: SUPPORT_EMAIL,
      subject,
      body: html,
    });

    if (error) {
      console.error("Support email failed:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Support API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
