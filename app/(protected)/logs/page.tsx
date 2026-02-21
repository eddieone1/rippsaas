"use client";

import { useState, useEffect } from "react";

interface Event {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
}

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
  status: string;
  channel: string;
  reason: string | null;
  renderedBody: string;
  sentAt: string | null;
  createdAt: string;
  play: Play;
  member: Member;
  events: Event[];
}

export default function LogsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");

  function load() {
    setLoading(true);
    const params = new URLSearchParams({
      tenantId: "demo-tenant",
      limit: "50",
      offset: "0",
    });
    if (status) params.set("status", status);
    if (channel) params.set("channel", channel);
    fetch(`/api/logs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.interventions) setInterventions(data.interventions);
        if (typeof data.total === "number") setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status, channel]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Intervention logs</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="">All</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="">All</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : interventions.length === 0 ? (
        <p className="text-gray-500">No interventions found.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Showing {interventions.length} of {total}</p>
          <ul className="space-y-4">
            {interventions.map((i) => (
              <li
                key={i.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {i.member.firstName} {i.member.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {i.play.name} · {i.channel} · {i.status}
                      {i.sentAt && ` · ${new Date(i.sentAt).toLocaleString()}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(i.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      i.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : i.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : i.status === "SENT"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {i.status}
                  </span>
                </div>
                {i.events?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-gray-600">
                    {i.events.map((ev) => (
                      <li key={ev.id}>
                        {ev.type} @ {new Date(ev.createdAt).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
