/**
 * Route guards for role-based access control
 * 
 * Usage in Server Components:
 * ```tsx
 * import { requireRole } from '@/lib/auth/guards';
 * 
 * export default async function SettingsPage() {
 *   const { user, userProfile } = await requireRole('owner');
 *   // ... rest of component
 * }
 * ```
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGymContext } from '@/lib/supabase/get-gym-context';
import type { UserRole } from './roles';
import { canPerformAction } from './roles';

type AuthUser = {
  id: string;
  email: string | undefined;
};

type UserProfile = {
  id: string;
  gym_id: string;
  email: string;
  full_name: string;
  role: UserRole;
};

type AuthContext = {
  user: AuthUser;
  userProfile: UserProfile;
  gymId: string;
};

/**
 * Require authentication (any role)
 * Throws redirect if not authenticated
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { userProfile, gymId } = await getGymContext();

  if (!userProfile || !gymId) {
    redirect('/onboarding/gym-info');
  }

  return {
    user: { id: user.id, email: user.email },
    userProfile: userProfile as UserProfile,
    gymId,
  };
}

/**
 * Require specific role
 * Throws redirect if user doesn't have required role
 */
export async function requireRole(requiredRole: UserRole): Promise<AuthContext> {
  const context = await requireAuth();

  if (context.userProfile.role !== requiredRole && context.userProfile.role !== 'owner') {
    // Owner can access everything, otherwise check exact match
    if (context.userProfile.role !== requiredRole) {
      redirect('/dashboard'); // Redirect to dashboard if insufficient permissions
    }
  }

  return context;
}

/**
 * Require minimum role level
 * Owner > Coach
 */
export async function requireMinimumRole(minimumRole: UserRole): Promise<AuthContext> {
  const context = await requireAuth();

  if (minimumRole === 'owner' && context.userProfile.role !== 'owner') {
    redirect('/dashboard');
  }

  // Coach minimum means both owner and coach can access
  return context;
}

/**
 * Require ability to perform specific action
 */
export async function requireAction(
  action: 'manage_settings' | 'manage_billing' | 'invite_users' | 'view_members' | 'run_campaigns'
): Promise<AuthContext> {
  const context = await requireAuth();

  if (!canPerformAction(context.userProfile.role, action)) {
    redirect('/dashboard');
  }

  return context;
}

/**
 * Get auth context without throwing (for conditional rendering)
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}
