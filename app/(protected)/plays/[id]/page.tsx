"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Play {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  minRiskScore: number;
  channels: string[];
  requiresApproval: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxMessagesPerMemberPerWeek: number;
  cooldownDays: number;
  templateSubject: string | null;
  templateBody: string;
}

export default function PlayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [play, setPlay] = useState<Play | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Play> | null>(null);

  useEffect(() => {
    fetch(`/api/plays/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setPlay(data);
        setForm({
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          minRiskScore: data.minRiskScore,
          channels: data.channels,
          requiresApproval: data.requiresApproval,
          quietHoursStart: data.quietHoursStart,
          quietHoursEnd: data.quietHoursEnd,
          maxMessagesPerMemberPerWeek: data.maxMessagesPerMemberPerWeek,
          cooldownDays: data.cooldownDays,
          templateSubject: data.templateSubject,
          templateBody: data.templateBody,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/plays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setPlay(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !play) {
    return <div className="text-gray-500">Loading…</div>;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/plays" className="text-sm text-gray-500 hover:text-gray-700">← Plays</Link>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{play.name}</h1>
      {form && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min risk score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.minRiskScore ?? 0}
              onChange={(e) => setForm((p) => ({ ...p, minRiskScore: Number(e.target.value) }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channels</label>
            <div className="flex gap-4">
              {["EMAIL", "SMS", "WHATSAPP"].map((c) => (
                <label key={c} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(form.channels ?? []).includes(c)}
                    onChange={() => {
                      const ch = form.channels ?? [];
                      setForm((p) => ({
                        ...p,
                        channels: ch.includes(c) ? ch.filter((x) => x !== c) : [...ch, c],
                      }));
                    }}
                  />
                  <span className="text-sm text-gray-700">{c}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requiresApproval ?? false}
                onChange={(e) => setForm((p) => ({ ...p, requiresApproval: e.target.checked }))}
              />
              <span className="text-sm font-medium text-gray-700">Requires approval</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template body</label>
            <textarea
              value={form.templateBody ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, templateBody: e.target.value }))}
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 font-mono text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
