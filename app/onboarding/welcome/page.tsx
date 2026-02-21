import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (userProfile?.gym_id) {
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, address_line1")
      .eq("id", userProfile.gym_id)
      .single();

    if (gym?.name && gym.name !== "My Gym" && gym?.address_line1) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="space-y-8 rounded-xl border border-white/[0.08] bg-[#1a1c1c] p-10 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome to Rip
          </h2>
          <p className="mt-4 text-white/70">
            You&apos;re three steps away from seeing which retention tactics actually work for your gym.
          </p>
          <ol className="mt-6 space-y-3 text-left text-sm text-white/80">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9EFF00]/20 text-[#9EFF00] font-semibold">1</span>
              Tell us about your gym
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9EFF00]/20 text-[#9EFF00] font-semibold">2</span>
              Start your 14-day free trial
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9EFF00]/20 text-[#9EFF00] font-semibold">3</span>
              Upload members and see what works
            </li>
          </ol>
        </div>
        <Link
          href="/onboarding/gym-info"
          className="block w-full rounded-lg bg-[#9EFF00] px-4 py-3 text-center text-sm font-semibold text-black hover:opacity-90"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
