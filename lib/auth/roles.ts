/**
 * User role types and display helpers.
 * Matches roles used in the app (owner, admin, coach).
 */

export type UserRole = "owner" | "admin" | "coach";

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  coach: "Coach",
};

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}
