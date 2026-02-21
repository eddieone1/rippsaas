"use client";

import type { Member } from "./insights-types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AtRiskListProps {
  members: Member[];
  seeAllHref?: string;
  /** Short text explaining how to interpret this list. */
  description?: string;
}

export default function AtRiskList({ members, seeAllHref = "#", description }: AtRiskListProps) {
  const list = members.filter((m) => m.stage === "at_risk").slice(0, 6);
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#2F3131] p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">At Risk Members</h3>
        <a href={seeAllHref} className="text-xs font-medium text-[#9EFF00] hover:underline">
          See all
        </a>
      </div>
      {description && (
        <p className="mt-1 text-xs text-white/55 leading-snug">{description}</p>
      )}
      <ul className="mt-3 space-y-2">
        {list.length === 0 ? (
          <li className="py-4 text-center text-sm text-white/50">No at-risk members</li>
        ) : (
          list.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/5 px-3 py-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                {getInitials(m.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{m.name}</p>
                <p className="text-xs text-white/55">{m.plan}</p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                  m.churnRiskScore >= 70 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {m.churnRiskScore}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
