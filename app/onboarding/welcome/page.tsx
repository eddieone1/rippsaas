import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import WelcomeClient from "@/components/onboarding/WelcomeClient";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("gym_id, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  // Onboarding complete → dashboard
  if (userProfile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  // Gym complete → go to payment (next step), don't skip
  if (userProfile?.gym_id) {
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, address_line1")
      .eq("id", userProfile.gym_id)
      .single();

    if (gym?.name && gym.name !== "My Gym" && gym?.address_line1) {
      redirect("/onboarding/payment");
    }
  }

  return (
    <WelcomeClient />
  );
}
