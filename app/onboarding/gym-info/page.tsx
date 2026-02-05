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

  // Check if user already has a gym
  const { data: userProfile } = await supabase
    .from("users")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (!userProfile?.gym_id) {
    redirect("/signup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Tell us about your gym
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We'll use this information to personalize your experience
          </p>
        </div>
        <GymInfoForm />
      </div>
    </div>
  );
}
