import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import { createClient } from "@/lib/supabase/server";
import OnboardingUploadClient from "@/components/onboarding/OnboardingUploadClient";

export default async function OnboardingUploadPage() {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  // Upload requires gym info and payment step done (user reaches here from payment)
  // If they navigated directly with incomplete gym, send to gym-info
  const supabase = await createClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("name, address_line1")
    .eq("id", gymId)
    .single();

  const gymComplete =
    !!gym?.name && gym.name !== "My Gym" && !!gym?.address_line1;

  if (!gymComplete) {
    redirect("/onboarding/gym-info");
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-8 rounded-xl border border-white/[0.08] bg-[#1a1c1c] p-8 shadow-xl">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Upload your members
          </h2>
          <p className="mt-2 text-center text-sm text-white/65">
            Import your member list to start tracking retention and reaching
            at-risk members. You can skip and do this later from the dashboard.
          </p>
        </div>
        <OnboardingUploadClient />
      </div>
    </div>
  );
}
