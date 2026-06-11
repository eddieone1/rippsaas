import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaymentForm from "@/components/onboarding/PaymentForm";

export default async function PaymentPage() {
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

  if (userProfile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  if (userProfile?.gym_id) {
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, address_line1")
      .eq("id", userProfile.gym_id)
      .single();

    if (!gym?.name || gym.name === "My Gym" || !gym?.address_line1) {
      redirect("/onboarding/gym-info");
    }
  } else {
    redirect("/onboarding/gym-info");
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-8 rounded-xl border border-white/[0.08] bg-[#1a1c1c] p-8 shadow-xl">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Choose your plan
          </h2>
          <p className="mt-2 text-center text-sm text-white/65">
            See which members are at risk before paying. Start with a free audit, or
            subscribe to track churn in Rip.
          </p>
        </div>
        <PaymentForm />
      </div>
    </div>
  );
}
