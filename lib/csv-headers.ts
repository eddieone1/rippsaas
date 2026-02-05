/**
 * Normalize CSV column headers so user labels like "membership status", "status",
 * "First Name", "date joined" map to the expected keys for upload processing.
 * Enables reasonable assumptions based on close-enough titling.
 */
export function normalizeCsvHeader(header: string): string {
  const raw = (header || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/\//g, "_");
  if (!raw) return header.trim() || "unknown";

  // "visit 1", "visit 2", "visit_1", "visit1" etc. -> visit_1, visit_2 (keep as distinct columns for logging)
  const visitNumMatch = raw.match(/^visit_?(\d+)$/);
  if (visitNumMatch) return "visit_" + visitNumMatch[1];

  const explicit: Record<string, string> = {
    date_joined: "joined_date",
    join_date: "joined_date",
    membership_start: "joined_date",
    start_date: "joined_date",
    firstname: "first_name",
    fname: "first_name",
    first: "first_name",
    lastname: "last_name",
    lname: "last_name",
    last: "last_name",
    surname: "last_name",
    email_address: "email",
    e_mail: "email",
    phone_number: "phone",
    telephone: "phone",
    mobile: "phone",
    last_visit: "last_visit_date",
    visit_date: "last_visit_date",
    dob: "date_of_birth",
    date_of_birth: "date_of_birth",
    birth_date: "date_of_birth",
    birthdate: "date_of_birth",
    visit_dates: "visits",
    visit_dates_list: "visits",
    membership: "status",
    membership_status: "status",
    member_status: "status",
    mem_status: "status",
    activity_status: "status",
    member_type: "status",
    membership_type: "status",
    active_inactive: "status",
    billing_address: "billing_address_line1",
    address: "billing_address_line1",
    street: "billing_address_line1",
    address_line1: "billing_address_line1",
  };

  if (explicit[raw]) return explicit[raw];

  // Fuzzy: close-enough column names
  if (raw === "status") return "status";
  if ((raw.includes("member") || raw.includes("membership")) && raw.includes("status")) return "status";
  if (raw.includes("first") && (raw.includes("name") || raw === "first")) return "first_name";
  if ((raw.includes("last") && raw.includes("name")) || raw === "last" || raw.includes("surname")) return "last_name";
  if (raw.includes("email")) return "email";
  if (raw.includes("phone") || raw.includes("mobile") || raw.includes("tel")) return "phone";
  if (raw.includes("dob") || raw.includes("birth")) return "date_of_birth";
  if (raw.includes("visit") && (raw.includes("date") || raw.includes("dates"))) return raw.includes("last") ? "last_visit_date" : "visits";
  if (raw.includes("join") && raw.includes("date")) return "joined_date";
  if (raw.includes("address") || raw.includes("street")) return "billing_address_line1";

  return raw;
}
