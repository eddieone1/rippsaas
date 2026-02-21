/**
 * Format membership status for display.
 * DB values: active, inactive, cancelled
 * Display: Active, Inactive, Cancelled
 */
export function formatMembershipStatus(status: string | null | undefined): string {
  const s = (status || "").toString().toLowerCase().trim();
  if (s === "active") return "Active";
  if (s === "inactive") return "Inactive";
  if (s === "cancelled") return "Cancelled";
  return status ? String(status) : "—";
}

export function getMembershipStatusBadgeColor(status: string | null | undefined): string {
  const s = (status || "").toString().toLowerCase().trim();
  switch (s) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
