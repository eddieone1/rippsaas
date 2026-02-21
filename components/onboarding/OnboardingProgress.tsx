"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { path: "/onboarding/welcome", label: "Welcome" },
  { path: "/onboarding/gym-info", label: "Gym info" },
  { path: "/onboarding/payment", label: "Start trial" },
];

export default function OnboardingProgress() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => pathname === s.path);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <div key={step.path} className="flex items-center">
            <Link
              href={step.path}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#9EFF00] text-black"
                  : isPast
                    ? "bg-white/20 text-white/80"
                    : "bg-white/10 text-white/50"
              }`}
            >
              {i + 1}. {step.label}
            </Link>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px w-6 ${
                  isPast ? "bg-[#9EFF00]/50" : "bg-white/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
