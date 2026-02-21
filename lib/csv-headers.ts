/**
 * Normalize CSV headers to handle common variations
 * Converts headers like "First Name", "first name", "First_Name" to "first_name"
 */
export function normalizeCsvHeader(header: string): string {
  if (!header) return "";

  return header
    .trim()
    .toLowerCase()
    // Replace spaces, hyphens, and underscores with underscores
    .replace(/[\s\-_]+/g, "_")
    // Remove any remaining special characters except underscores
    .replace(/[^a-z0-9_]/g, "")
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, "");
}
