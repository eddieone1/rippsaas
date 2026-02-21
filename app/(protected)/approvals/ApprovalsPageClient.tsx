"use client";

import { useState, useEffect } from "react";

interface Member {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Play {
  name: string;
}

interface Intervention {
  id: string;
  channel: string;
  reason: string | null;
  renderedSubject: string | null;
  renderedBody: string;
  createdAt: string;
  play: Play;
  member: Member;
}

interface ApprovalsPageClientProps {
  tenantId: string;
}

export default function ApprovalsPageClient({ tenantId }: ApprovalsPageClientProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(
      `/api/logs?tenantId=${encodeURIComponent(tenantId)}&status=PENDING_APPROVAL&limit=100`
    );
    const data = await res.json();
    if (data.interventions) setInterventions(data.interventions);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [tenantId]);

  async function approve(id: string) {
    const res = await fetch(`/api/interventions/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setInterventions((prev) => prev.filter((i) => i.id !== id));
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to approve");
    }
  }

  async function cancel(id: string) {
    const res = await fetch(`/api/interventions/${id}/cancel`, { method: "POST" });
    if (res.ok) {
      setInterventions((prev) => prev.filter((i) => i.id !== id));
    }
  }

  const byPlay = interventions.reduce((acc, i) => {
    const name = i.play.name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(i);
    return acc;
  }, {} as Record<string, Intervention[]>);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Approvals queue</h1>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : interventions.length === 0 ? (
        <p className="text-gray-500">No interventions pending approval.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(byPlay).map(([playName, list]) => (
            <div key={playName}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{playName}</h2>
              <ul className="space-y-4">
                {list.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {i.member.firstName} {i.member.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {i.channel} · {i.reason ?? "—"}
                        </p>
                        <div className="mt-2 rounded bg-white p-3 text-sm text-gray-700 border border-gray-100">
                          {i.renderedSubject && (
                            <p className="font-medium text-gray-800">Subject: {i.renderedSubject}</p>
                          )}
                          <p className="mt-1 whitespace-pre-wrap">{i.renderedBody}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => approve(i.id)}
                          className="rounded-md bg-lime-500 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-lime-400"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => cancel(i.id)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
