import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "audit-uploads";
const MAX_CSV_BYTES = 10 * 1024 * 1024;

export function sanitizeAuditFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload.csv";
}

export async function uploadAuditCsv(
  auditRequestId: string,
  file: File
): Promise<{ path: string; originalFilename: string } | { error: string }> {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "Only CSV files are allowed." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { error: "CSV file must be 10MB or smaller." };
  }

  const originalFilename = file.name;
  const safeName = sanitizeAuditFilename(originalFilename);
  const path = `${auditRequestId}/${Date.now()}-${safeName}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "text/csv",
    upsert: false,
  });

  if (error) {
    console.error("Audit CSV storage upload failed:", error.message);
    return { error: "Failed to store CSV file. Please try again or email your export." };
  }

  return { path, originalFilename };
}
