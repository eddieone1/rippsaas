import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { uploadAuditCsv } from "@/lib/audit-storage";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function parseAuditBody(req: Request): Promise<{
  gymName: string;
  contactName: string;
  email: string;
  activeMembers: string;
  gymSoftware: string;
  csvFile: File | null;
}> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const csv = form.get("csv");
    return {
      gymName: String(form.get("gymName") ?? "").trim(),
      contactName: String(form.get("contactName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      activeMembers: String(form.get("activeMembers") ?? "").trim(),
      gymSoftware: String(form.get("gymSoftware") ?? "").trim(),
      csvFile: csv instanceof File && csv.size > 0 ? csv : null,
    };
  }

  const body = await req.json();
  return {
    gymName: String(body.gymName ?? "").trim(),
    contactName: String(body.contactName ?? "").trim(),
    email: String(body.email ?? "").trim(),
    activeMembers: String(body.activeMembers ?? "").trim(),
    gymSoftware: String(body.gymSoftware ?? "").trim(),
    csvFile: null,
  };
}

/**
 * POST /api/audit/request
 * Lead capture for Free Retention Audit — not a subscription.
 */
export async function POST(req: Request) {
  const supportEmail =
    process.env.SUPPORT_EMAIL?.trim() || process.env.RESEND_FROM_EMAIL?.trim();
  if (!supportEmail) {
    console.error("Audit API: SUPPORT_EMAIL or RESEND_FROM_EMAIL not configured");
    return NextResponse.json(
      { error: "Audit requests are not configured. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const { gymName, contactName, email, activeMembers, gymSoftware, csvFile } =
      await parseAuditBody(req);

    if (!gymName || !contactName || !email || !activeMembers || !gymSoftware) {
      return NextResponse.json(
        { error: "All fields are required except CSV upload." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: inserted, error: insertError } = await adminClient
      .from("audit_requests")
      .insert({
        gym_name: gymName,
        contact_name: contactName,
        email,
        active_members: activeMembers,
        gym_software: gymSoftware,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Audit request DB insert failed:", insertError?.message);
      return NextResponse.json(
        { error: "Failed to save audit request. Please try again later." },
        { status: 500 }
      );
    }

    let csvNote = "No CSV uploaded.";
    if (csvFile) {
      const upload = await uploadAuditCsv(inserted.id, csvFile);
      if ("error" in upload) {
        return NextResponse.json({ error: upload.error }, { status: 400 });
      }
      await adminClient
        .from("audit_requests")
        .update({
          csv_storage_path: upload.path,
          csv_original_filename: upload.originalFilename,
        })
        .eq("id", inserted.id);
      csvNote = `CSV uploaded: ${upload.originalFilename} (storage: ${upload.path})`;
    }

    const subject = `Free Retention Audit: ${gymName.slice(0, 50)}`;
    const html = `
      <h2>New Free Retention Audit request</h2>
      <p><strong>Plan:</strong> free_audit</p>
      <p><strong>Request ID:</strong> ${escapeHtml(inserted.id)}</p>
      <p><strong>Gym:</strong> ${escapeHtml(gymName)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(contactName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Active members:</strong> ${escapeHtml(activeMembers)}</p>
      <p><strong>Gym software:</strong> ${escapeHtml(gymSoftware)}</p>
      <p><strong>CSV:</strong> ${escapeHtml(csvNote)}</p>
    `;

    const { error } = await sendEmail({
      to: supportEmail,
      subject,
      body: html,
    });

    if (error) {
      console.error("Audit request email failed:", error);
      return NextResponse.json(
        { error: "Failed to submit request. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (err) {
    console.error("Audit request API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
