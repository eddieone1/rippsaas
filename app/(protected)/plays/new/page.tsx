"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPlayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    triggerType: "DAILY_BATCH",
    minRiskScore: 50,
    channels: [] as string[],
    requiresApproval: false,
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
    maxMessagesPerMemberPerWeek: 2,
    cooldownDays: 3,
    templateSubject: "",
    templateBody: "Hi {{firstName}}, we noticed you might need a nudge. {{primaryRiskReason}}",
  });

  function toggleChannel(c: string) {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(c)
        ? prev.channels.filter((x) => x !== c)
        : [...prev.channels, c],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.channels.length === 0) {
      setError("Select at least one channel");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/plays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description || undefined,
          templateSubject: form.templateSubject || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      router.push(`/plays/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create play");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New play</h1>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min risk score (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.minRiskScore}
            onChange={(e) => setForm((p) => ({ ...p, minRiskScore: Number(e.target.value) }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
          <div className="flex gap-4">
            {["EMAIL", "SMS", "WHATSAPP"].map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.channels.includes(c)}
                  onChange={() => toggleChannel(c)}
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
              checked={form.requiresApproval}
              onChange={(e) => setForm((p) => ({ ...p, requiresApproval: e.target.checked }))}
            />
            <span className="text-sm font-medium text-gray-700">Requires coach approval</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiet hours start</label>
            <input
              type="text"
              value={form.quietHoursStart}
              onChange={(e) => setForm((p) => ({ ...p, quietHoursStart: e.target.value }))}
              placeholder="21:00"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiet hours end</label>
            <input
              type="text"
              value={form.quietHoursEnd}
              onChange={(e) => setForm((p) => ({ ...p, quietHoursEnd: e.target.value }))}
              placeholder="08:00"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email subject (optional)</label>
          <input
            type="text"
            value={form.templateSubject}
            onChange={(e) => setForm((p) => ({ ...p, templateSubject: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{"Message body (use {{firstName}}, {{primaryRiskReason}}, etc.)"}</label>
          <textarea
            value={form.templateBody}
            onChange={(e) => setForm((p) => ({ ...p, templateBody: e.target.value }))}
            rows={5}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 font-mono text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create play"}
          </button>
          <Link
            href="/plays"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
