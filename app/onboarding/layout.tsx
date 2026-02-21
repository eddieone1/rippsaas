import Link from "next/link";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <OnboardingProgress />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
