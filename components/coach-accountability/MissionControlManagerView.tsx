"use client";

import type { Member, Coach } from "./mission-control-types";

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

interface MissionControlManagerViewProps {
  members: Member[];
  coaches: Coach[];
  coachMetrics: { coachId: string; contactedThisWeekCount: number; atRiskAssignedCount: number }[];
  isOpen: boolean;
  onClose: () => void;
  onReassign: (memberId: string, coachId: string) => void;
}

export default function MissionControlManagerView({
  members,
  coaches,
  coachMetrics,
  isOpen,
  onClose,
  onReassign,
}: MissionControlManagerViewProps) {
  if (!isOpen) return null;

  const unassignedRisk = members.filter((m) => !m.coachOwnerId && m.riskLevel === "high");
  const highRiskNoContact = members.filter(
    (m) => m.riskLevel === "high" && daysSince(m.lastInteractionDate) >= 7
  );
  const lowActivityCoaches = coachMetrics.filter(
    (c) => c.contactedThisWeekCount === 0 && c.atRiskAssignedCount > 0
  );

  const alerts = [
    ...highRiskNoContact.slice(0, 3).map((m) => ({
      type: "high_risk" as const,
      message: `${m.name}: High-risk, not contacted this week`,
      memberId: m.id,
    })),
    ...lowActivityCoaches.slice(0, 2).map((c) => ({
      type: "coach_inactive" as const,
      message: `Coach ${coaches.find((x) => x.id === c.coachId)?.name ?? "Unknown"}: 0 outreach in 3+ days`,
      coachId: c.coachId,
    })),
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-gray-200 bg-white shadow-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Manager Oversight</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Unassigned risk */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <h4 className="text-sm font-semibold text-amber-900">Unassigned risk</h4>
            {unassignedRisk.length === 0 ? (
              <p className="mt-2 text-sm text-amber-800">All high-risk members assigned</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {unassignedRisk.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded border border-amber-200 bg-white p-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    <select
                      className="rounded border border-gray-200 text-xs"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) onReassign(m.id, v);
                      }}
                    >
                      <option value="">Assign...</option>
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Low activity coaches */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
            <h4 className="text-sm font-semibold text-red-900">Low activity coaches</h4>
            {lowActivityCoaches.length === 0 ? (
              <p className="mt-2 text-sm text-red-800">All coaches active</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {lowActivityCoaches.map((c) => (
                  <li key={c.coachId} className="text-sm text-red-800">
                    {coaches.find((x) => x.id === c.coachId)?.name} – 0 outreach, {c.atRiskAssignedCount} at-risk assigned
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Alerts */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-gray-900">Alerts</h4>
            <ul className="mt-2 space-y-2">
              {alerts.length === 0 ? (
                <li className="text-sm text-gray-700">No alerts</li>
              ) : (
                alerts.map((a, i) => (
                  <li key={i} className="rounded border border-gray-100 bg-gray-50 p-2 text-sm text-gray-700">
                    {a.message}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Set targets placeholder */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">Targets per coach</h4>
            <p className="mt-2 text-xs text-gray-700">Set daily/weekly contact targets (mock – coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
