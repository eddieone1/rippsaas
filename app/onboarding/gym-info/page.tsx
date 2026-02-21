import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GymInfoForm from "@/components/onboarding/GymInfoForm";

export default async function GymInfoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check gym status
  const { data: userProfile } = await supabase
    .from("users")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  // If user has a gym_id, check if gym info is already filled in
  if (userProfile?.gym_id) {
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, address_line1")
      .eq("id", userProfile.gym_id)
      .single();

    // If gym has name (not default) and address, onboarding is complete - redirect to dashboard
    if (gym?.name && gym.name !== "My Gym" && gym?.address_line1) {
      redirect("/dashboard");
    }
    // Otherwise, allow them to continue with onboarding (gym exists but info not filled)
  }
  // If no gym_id, this is unusual but allow them to proceed
  // (The form submission will handle creating/updating the gym)

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8 rounded-xl border border-white/[0.08] bg-[#1a1c1c] p-8 shadow-xl">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tell us about your gym
          </h2>
          <p className="mt-2 text-center text-sm text-white/65">
            We&apos;ll use this to personalise your experience and member insights
          </p>
        </div>
        <GymInfoForm />
      </div>
    </div>
  );
}
