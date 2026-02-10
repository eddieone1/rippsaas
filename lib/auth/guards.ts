import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export type AuthContext = {
  userProfile: UserProfile;
  gymId: string;
};

/**
 * Require authenticated user with a gym. Redirects to /login if not signed in or no gym.
 * Use in layout and server components; in API routes this will send a redirect response.
 */
export async function requireAuth(): Promise<AuthContext> {
  const { user, userProfile, gymId } = await getGymContext();

  if (!user?.id) {
    redirect("/login");
  }

  if (!gymId || !userProfile) {
    redirect("/login");
  }

  return { userProfile, gymId };
}

const ACTION_ROLES: Record<string, ("owner" | "admin")[]> = {
  manage_settings: ["owner"],
  invite_users: ["owner"],
};

/**
 * Require auth and that the user has permission for the given action.
 * Redirects on failure.
 */
export async function requireAction(
  action: keyof typeof ACTION_ROLES
): Promise<AuthContext> {
  const ctx = await requireAuth();
  const allowedRoles = ACTION_ROLES[action];
  if (
    !allowedRoles?.length ||
    !ctx.userProfile.role ||
    !allowedRoles.includes(ctx.userProfile.role)
  ) {
    redirect("/dashboard");
  }
  return ctx;
}

/**
 * Require auth and that the user has the given role.
 * For "coach": allows "coach" or "admin" (admin can use coach features until coach role exists in DB).
 */
export async function requireRole(
  role: "owner" | "admin" | "coach"
): Promise<AuthContext> {
  const ctx = await requireAuth();
  const userRole = ctx.userProfile.role;

  if (role === "coach") {
    if (userRole === "coach" || userRole === "admin") {
      return ctx;
    }
  } else if (userRole === role) {
    return ctx;
  }

  redirect("/dashboard");
}
