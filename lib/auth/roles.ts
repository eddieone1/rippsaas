/**
 * Role-based access control utilities
 * 
 * Roles:
 * - owner: Full access to organization settings, billing, all features
 * - coach: Limited access, can view members and run campaigns, cannot manage settings
 */

export type UserRole = 'owner' | 'coach';

export const ROLES = {
  OWNER: 'owner' as const,
  COACH: 'coach' as const,
} as const;

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // Owner has access to everything
  if (userRole === ROLES.OWNER) return true;
  
  // Coach can only access coach-level features
  return userRole === requiredRole;
}

/**
 * Check if user has at least the required role level
 * Owner > Coach
 */
export function hasMinimumRole(userRole: UserRole | null | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  
  if (minimumRole === ROLES.OWNER) {
    return userRole === ROLES.OWNER;
  }
  
  // Coach minimum means both owner and coach can access
  return userRole === ROLES.OWNER || userRole === ROLES.COACH;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  return role === ROLES.OWNER ? 'Owner' : 'Coach';
}

/**
 * Check if role can perform action
 */
export function canPerformAction(
  userRole: UserRole | null | undefined,
  action: 'manage_settings' | 'manage_billing' | 'invite_users' | 'view_members' | 'run_campaigns'
): boolean {
  if (!userRole) return false;
  
  // Owner can do everything
  if (userRole === ROLES.OWNER) return true;
  
  // Coach permissions
  switch (action) {
    case 'manage_settings':
    case 'manage_billing':
    case 'invite_users':
      return false; // Only owners
    case 'view_members':
    case 'run_campaigns':
      return true; // Coaches can do this
    default:
      return false;
  }
}
