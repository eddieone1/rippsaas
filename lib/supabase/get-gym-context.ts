import { createClient } from "./server";
import { Database } from "@/types/database";

type User = Database["public"]["Tables"]["users"]["Row"];

export async function getGymContext(): Promise<{
  user: { id: string; email: string | undefined };
  userProfile: User | null;
  gymId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: { id: "", email: undefined },
      userProfile: null,
      gymId: null,
    };
  }

  // Get user profile with gym_id
  const { data: userProfile } = await supabase
    .from("users")
    .select("*, gym_id")
    .eq("id", user.id)
    .single();

  return {
    user: { id: user.id, email: user.email },
    userProfile: userProfile as User | null,
    gymId: userProfile?.gym_id || null,
  };
}
