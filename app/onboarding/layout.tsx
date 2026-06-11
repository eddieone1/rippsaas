import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let gymInfoComplete = false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
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

      gymInfoComplete =
        !!gym?.name && gym.name !== "My Gym" && !!gym?.address_line1;
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0B0B0B 0%, #1F2121 40%, #2F3131 100%)",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/rip dashboard logo - Edited.png"
              alt="Rip"
              className="h-24 w-auto object-contain -my-6 block"
            />
          </Link>
          <OnboardingProgress gymInfoComplete={gymInfoComplete} />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
