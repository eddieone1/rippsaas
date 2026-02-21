"use client";

import type { Campaign } from "./insights-types";

interface CampaignTableProps {
  campaigns: Campaign[];
  viewAllHref?: string;
  /** Short text explaining how to interpret this table. */
  description?: string;
}

export default function CampaignTable({ campaigns, viewAllHref = "#", description }: CampaignTableProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#2F3131] overflow-hidden shadow-lg">
      <div className="p-4 border-b border-white/[0.08]">
        <h3 className="text-sm font-semibold text-white">Outreach Performance Breakdown</h3>
        {description && (
          <p className="mt-1 text-xs text-white/55 leading-snug">{description}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="px-4 py-3 font-semibold text-white/90">Rank</th>
              <th className="px-4 py-3 font-semibold text-white/90">Play / Send Name</th>
              <th className="px-4 py-3 font-semibold text-white/90">Date range</th>
              <th className="px-4 py-3 font-semibold text-white/90">Members Reached</th>
              <th className="px-4 py-3 font-semibold text-[#9EFF00]">Response Rate</th>
              <th className="px-4 py-3 font-semibold text-white/90">Members Saved</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={c.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-white/70">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-white/65">
                  {c.startDate} – {c.endDate}
                </td>
                <td className="px-4 py-3 text-white/70">{c.membersReached}</td>
                <td className="px-4 py-3 font-medium text-[#9EFF00]">{c.responseRate}%</td>
                <td className="px-4 py-3 text-white/70">{c.membersSaved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-white/[0.08]">
        <a href={viewAllHref} className="text-xs font-medium text-[#9EFF00] hover:underline">
          View all plays
        </a>
      </div>
    </div>
  );
}
