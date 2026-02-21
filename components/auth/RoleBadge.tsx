/**
 * Role badge component for displaying user role
 */

import { getRoleDisplayName } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/roles";

export default function RoleBadge({ role }: { role: UserRole }) {
  const displayName = getRoleDisplayName(role);
  const isOwner = role === "owner";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isOwner
          ? "bg-purple-100 text-purple-800"
          : "bg-lime-100 text-lime-800"
      }`}
    >
      {displayName}
    </span>
  );
}
