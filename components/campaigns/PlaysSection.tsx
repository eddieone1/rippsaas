"use client";

import { useState, useEffect, useCallback } from "react";
import PlayFormModal from "./PlayFormModal";

interface Play {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  minRiskScore: number;
  channels: string[];
  requiresApproval: boolean;
  createdAt: string;
}

export default function PlaysSection() {
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const loadPlays = useCallback(() => {
    setLoading(true);
    fetch("/api/plays")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlays(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPlays();
  }, [loadPlays]);

  async function toggleActive(play: Play) {
    const res = await fetch(`/api/plays/${play.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !play.isActive }),
    });
    if (res.ok) {
      setPlays((prev) =>
        prev.map((p) =>
          p.id === play.id ? { ...p, isActive: !p.isActive } : p
        )
      );
    }
  }

  async function deletePlay(id: string) {
    if (!confirm("Delete this play? This cannot be undone.")) return;
    const res = await fetch(`/api/plays/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlays((prev) => prev.filter((p) => p.id !== id));
    }
  }

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
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Intervention plays
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Automated outreach rules that target at-risk members based on risk
            score, channel, and guardrails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="shrink-0 rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-white hover:bg-lime-600"
        >
          New play
        </button>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading plays...</p>
        ) : plays.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
            <div className="text-4xl opacity-50 mb-3">⚡</div>
            <p className="text-sm font-medium text-gray-900">No automated plays yet</p>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Create a play to define outreach rules. The system runs daily and queues interventions for your approval.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Use presets to get started quickly.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {plays.map((play) => (
              <li
                key={play.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-lime-200 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlayId(play.id)}
                      className="font-semibold text-gray-900 hover:text-lime-600"
                    >
                      {play.name}
                    </button>
                    {!play.isActive && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                    {play.requiresApproval && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Approval required
                      </span>
                    )}
                    {play.channels.map((ch) => (
                      <span
                        key={ch}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${channelBadge(ch)}`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Risk &ge; {play.minRiskScore} &middot; {play.triggerType}
                    {play.description
                      ? ` · ${play.description.slice(0, 60)}${play.description.length > 60 ? "…" : ""}`
                      : ""}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(play)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                      play.isActive
                        ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        : "border-lime-300 bg-lime-50 text-lime-700 hover:bg-lime-100"
                    }`}
                  >
                    {play.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlayId(play.id)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePlay(play.id)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      {showNewForm && (
        <PlayFormModal
          onClose={() => setShowNewForm(false)}
          onSaved={() => {
            setShowNewForm(false);
            loadPlays();
          }}
        />
      )}
      {editingPlayId && (
        <PlayFormModal
          playId={editingPlayId}
          onClose={() => setEditingPlayId(null)}
          onSaved={() => {
            setEditingPlayId(null);
            loadPlays();
          }}
        />
      )}
    </div>
  );
}
