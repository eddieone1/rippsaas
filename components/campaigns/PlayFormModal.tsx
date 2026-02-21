"use client";

import { useState, useEffect } from "react";

interface PlayData {
  id?: string;
  name: string;
  description: string;
  triggerType: string;
  minRiskScore: number;
  channels: string[];
  requiresApproval: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxMessagesPerMemberPerWeek: number;
  cooldownDays: number;
  templateSubject: string;
  templateBody: string;
}

interface PlayFormModalProps {
  playId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM: PlayData = {
  name: "",
  description: "",
  triggerType: "DAILY_BATCH",
  minRiskScore: 50,
  channels: [],
  requiresApproval: false,
  quietHoursStart: "21:00",
  quietHoursEnd: "08:00",
  maxMessagesPerMemberPerWeek: 2,
  cooldownDays: 3,
  templateSubject: "",
  templateBody:
    "Hi {{firstName}}, we noticed you might need a nudge. {{primaryRiskReason}}",
};

const PRESETS: { id: string; label: string; data: Partial<PlayData> }[] = [
  {
    id: "at-risk-nudge",
    label: "Standard at-risk nudge",
    data: {
      name: "At-risk nudge",
      description: "Gentle check-in for members with medium/high risk",
      minRiskScore: 50,
      channels: ["EMAIL"],
      requiresApproval: true,
      templateSubject: "We miss you!",
      templateBody:
        "Hi {{firstName}}, we noticed you might need a nudge. {{primaryRiskReason}}\n\nWe'd love to see you back. Reply if you have any questions.",
    },
  },
  {
    id: "win-back",
    label: "Win-back offer",
    data: {
      name: "Win-back offer",
      description: "Offer for lapsed or high-risk members",
      minRiskScore: 70,
      channels: ["EMAIL"],
      requiresApproval: true,
      templateSubject: "We have something for you",
      templateBody:
        "Hi {{firstName}}, we've missed you! {{primaryRiskReason}}\n\nCome back this week and we'll make it worth your while. Reply to claim your offer.",
    },
  },
  {
    id: "silent-quit",
    label: "Silent quit intervention",
    data: {
      name: "Silent quit check-in",
      description: "For members who've gone quiet",
      minRiskScore: 60,
      channels: ["EMAIL", "SMS"],
      requiresApproval: true,
      maxMessagesPerMemberPerWeek: 2,
      cooldownDays: 5,
      templateSubject: "Quick check-in",
      templateBody:
        "Hi {{firstName}}, just checking in. {{primaryRiskReason}} — we're here when you're ready.",
    },
  },
];

export default function PlayFormModal({
  playId,
  onClose,
  onSaved,
}: PlayFormModalProps) {
  const isEdit = !!playId;
  const [form, setForm] = useState<PlayData>(EMPTY_FORM);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset?.data) {
      setForm((prev) => ({ ...prev, ...preset.data }));
      setSelectedPreset(presetId);
    }
  };

  useEffect(() => {
    if (!playId) return;
    fetch(`/api/plays/${playId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setForm({
            id: data.id,
            name: data.name ?? "",
            description: data.description ?? "",
            triggerType: data.triggerType ?? "DAILY_BATCH",
            minRiskScore: data.minRiskScore ?? 50,
            channels: data.channels ?? [],
            requiresApproval: data.requiresApproval ?? false,
            quietHoursStart: data.quietHoursStart ?? "21:00",
            quietHoursEnd: data.quietHoursEnd ?? "08:00",
            maxMessagesPerMemberPerWeek:
              data.maxMessagesPerMemberPerWeek ?? 2,
            cooldownDays: data.cooldownDays ?? 3,
            templateSubject: data.templateSubject ?? "",
            templateBody: data.templateBody ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [playId]);

  function toggleChannel(c: string) {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(c)
        ? prev.channels.filter((x) => x !== c)
        : [...prev.channels, c],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.channels.length === 0) {
      setError("Select at least one channel");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/plays/${playId}` : "/api/plays";
      const method = isEdit ? "PATCH" : "POST";
      const body = {
        ...form,
        description: form.description || undefined,
        templateSubject: form.templateSubject || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save play");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit play" : "New play"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEdit && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start from preset
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedPreset === p.id
                          ? "border-lime-500 bg-lime-50 text-lime-800"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Risk ≥50 = medium/high risk · Presets pre-fill message and guardrails
                </p>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Min risk score (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.minRiskScore}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    minRiskScore: Number(e.target.value),
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Channels
              </label>
              <div className="flex gap-4">
                {["EMAIL", "SMS", "WHATSAPP"].map((c) => (
                  <label key={c} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.channels.includes(c)}
                      onChange={() => toggleChannel(c)}
                      className="rounded border-gray-300 text-lime-500 focus:ring-lime-500"
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
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      requiresApproval: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-lime-500 focus:ring-lime-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Requires approval before sending
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Quiet hours start
                </label>
                <input
                  type="text"
                  value={form.quietHoursStart}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      quietHoursStart: e.target.value,
                    }))
                  }
                  placeholder="21:00"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Quiet hours end
                </label>
                <input
                  type="text"
                  value={form.quietHoursEnd}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      quietHoursEnd: e.target.value,
                    }))
                  }
                  placeholder="08:00"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Max msgs/member/week
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxMessagesPerMemberPerWeek}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxMessagesPerMemberPerWeek: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cooldown (days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={form.cooldownDays}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cooldownDays: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email subject (optional)
              </label>
              <input
                type="text"
                value={form.templateSubject}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    templateSubject: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {"Message body (use {{firstName}}, {{primaryRiskReason}}, etc.)"}
              </label>
              <textarea
                value={form.templateBody}
                onChange={(e) =>
                  setForm((p) => ({ ...p, templateBody: e.target.value }))
                }
                rows={4}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-md bg-lime-500 py-2 text-sm font-semibold text-white hover:bg-lime-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : isEdit ? "Save changes" : "Create play"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
