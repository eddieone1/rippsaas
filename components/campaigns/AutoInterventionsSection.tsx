"use client";

import { useState, useEffect, useCallback } from "react";

interface Member {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Play {
  name: string;
}

interface PendingIntervention {
  id: string;
  channel: string;
  reason: string | null;
  renderedSubject: string | null;
  renderedBody: string;
  createdAt: string;
  play: Play;
  member: Member;
}

export default function AutoInterventionsSection({ gymId }: { gymId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(true);

  const [interventions, setInterventions] = useState<PendingIntervention[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch toggle state
  useEffect(() => {
    fetch("/api/settings/auto-interventions")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.enabled != null) setEnabled(json.data.enabled);
      })
      .catch(() => {})
      .finally(() => setLoadingToggle(false));
  }, []);

  // Fetch pending approvals
  const loadQueue = useCallback(() => {
    setLoadingQueue(true);
    fetch(`/api/logs?tenantId=${encodeURIComponent(gymId)}&status=PENDING_APPROVAL&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        if (data.interventions) setInterventions(data.interventions);
      })
      .catch(() => {})
      .finally(() => setLoadingQueue(false));
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, gymId]);

  // Toggle handler
  const handleToggle = async () => {
    setToggling(true);
    const newValue = !enabled;
    try {
      const res = await fetch("/api/settings/auto-interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue }),
      });
      if (res.ok) {
        setEnabled(newValue);
      }
    } catch {
      // revert on error
    } finally {
      setToggling(false);
    }
  };

  // Approve
  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      const res = await fetch(`/api/interventions/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setInterventions((prev) => prev.filter((i) => i.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to approve");
      }
    } finally {
      setActioning(null);
    }
  };

  // Decline
  const handleDecline = async (id: string) => {
    setActioning(id);
    try {
      const res = await fetch(`/api/interventions/${id}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setInterventions((prev) => prev.filter((i) => i.id !== id));
      }
    } finally {
      setActioning(null);
    }
  };

  // Approve all
  const handleApproveAll = async () => {
    setActioning("all");
    for (const i of interventions) {
      try {
        await fetch(`/api/interventions/${i.id}/approve`, { method: "POST" });
      } catch {
        // continue with next
      }
    }
    setInterventions([]);
    setActioning(null);
  };

  // Decline all
  const handleDeclineAll = async () => {
    setActioning("all");
    for (const i of interventions) {
      try {
        await fetch(`/api/interventions/${i.id}/cancel`, { method: "POST" });
      } catch {
        // continue with next
      }
    }
    setInterventions([]);
    setActioning(null);
  };

  // Group by play
  const byPlay = interventions.reduce(
    (acc, i) => {
      const name = i.play.name;
      if (!acc[name]) acc[name] = [];
      acc[name].push(i);
      return acc;
    },
    {} as Record<string, PendingIntervention[]>
  );

  const channelBadge = (ch: string) => {
    const colors: Record<string, string> = {
      EMAIL: "bg-blue-100 text-blue-700",
      SMS: "bg-green-100 text-green-700",
      WHATSAPP: "bg-emerald-100 text-emerald-700",
    };
    return colors[ch] ?? "bg-gray-100 text-gray-700";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-lg transition-shadow">
      {/* Header with toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Automated interventions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            When enabled, the system automatically identifies at-risk members
            daily and generates outreach. Every intervention requires your
            approval before it is sent.
          </p>
        </div>
        <div className="ml-4 shrink-0">
          {loadingToggle ? (
            <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={toggling}
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 ${
                enabled ? "bg-lime-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Approval queue */}
      <div className="px-6 py-4">
        {loadingQueue ? (
          <p className="text-sm text-gray-500">Loading approval queue...</p>
        ) : interventions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
            <p className="text-sm text-gray-500">
              {enabled
                ? "No interventions pending approval. The system checks daily at 9 AM."
                : "Enable automated interventions above to start generating outreach for at-risk members."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {interventions.length} intervention
                {interventions.length !== 1 ? "s" : ""} pending approval
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApproveAll}
                  disabled={actioning === "all"}
                  className="rounded-md bg-lime-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-lime-600 disabled:opacity-50"
                >
                  Approve all
                </button>
                <button
                  type="button"
                  onClick={handleDeclineAll}
                  disabled={actioning === "all"}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Decline all
                </button>
              </div>
            </div>

            {/* Grouped by play */}
            {Object.entries(byPlay).map(([playName, list]) => (
              <div key={playName}>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  {playName}{" "}
                  <span className="font-normal text-gray-400">
                    ({list.length})
                  </span>
                </h3>
                <ul className="space-y-2">
                  {list.map((intervention) => {
                    const isExpanded = expandedId === intervention.id;
                    const isActioning = actioning === intervention.id;
                    return (
                      <li
                        key={intervention.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : intervention.id)
                            }
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {intervention.member.firstName}{" "}
                                {intervention.member.lastName}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${channelBadge(
                                  intervention.channel
                                )}`}
                              >
                                {intervention.channel}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {intervention.reason ?? "At-risk member"} &middot;{" "}
                              {new Date(
                                intervention.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(intervention.id)}
                              disabled={isActioning}
                              className="rounded-md bg-lime-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-lime-600 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecline(intervention.id)}
                              disabled={isActioning}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                        {/* Expanded preview */}
                        {isExpanded && (
                          <div className="mt-3 rounded-md border border-gray-100 bg-white p-3 text-sm text-gray-700">
                            {intervention.renderedSubject && (
                              <p className="mb-1 font-medium text-gray-800">
                                Subject: {intervention.renderedSubject}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap text-xs">
                              {intervention.renderedBody}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
