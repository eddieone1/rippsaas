"use client";

import { useState, useEffect } from "react";

const GROUPS = [
  {
    label: "Get started",
    sections: [
      { id: "branding", label: "Branding" },
      { id: "communications", label: "Email & SMS" },
    ],
  },
  {
    label: "Retention",
    sections: [
      { id: "auto-interventions", label: "Auto outreach" },
      { id: "memberships", label: "Memberships" },
      { id: "members", label: "Members" },
    ],
  },
  {
    label: "Scale",
    sections: [
      { id: "studio", label: "Studio" },
      { id: "staff", label: "Staff" },
    ],
  },
  {
    label: "Account",
    sections: [
      { id: "personal", label: "Personal" },
      { id: "gym-profile", label: "Gym & Subscription" },
    ],
  },
] as const;

const ALL_SECTION_IDS = GROUPS.flatMap((g) => g.sections.map((s) => s.id));

export default function SettingsNav({ isOwner }: { isOwner: boolean }) {
  const [activeId, setActiveId] = useState<string | null>("branding");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY + 150;
      for (let i = ALL_SECTION_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(ALL_SECTION_IDS[i]);
        if (el && el.offsetTop <= scrollTop) {
          setActiveId(ALL_SECTION_IDS[i]);
          return;
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="sticky top-4 z-10 flex overflow-x-auto gap-2 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur scrollbar-thin lg:flex-col lg:overflow-visible"
      aria-label="Settings sections"
    >
      {GROUPS.map((group) => {
        const sections = group.sections.filter(
          (s) => s.id !== "staff" || isOwner
        );
        if (sections.length === 0) return null;

        return (
          <div key={group.label} className="space-y-1">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {group.label}
            </p>
            {sections.map((s) => {
              const isActive = activeId === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`flex min-h-[44px] min-w-[44px] items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation lg:min-w-0 ${
                    isActive
                      ? "bg-lime-100 text-lime-900"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {s.label}
                </a>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
