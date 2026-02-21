"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
}

interface RunPlayOnMembersModalProps {
  gymId: string;
  memberIds: string[];
  memberCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RunPlayOnMembersModal({
  gymId,
  memberIds,
  memberCount,
  onClose,
  onSuccess,
}: RunPlayOnMembersModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaigns/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => setTemplates([]));
  }, []);

  const channelTemplates = templates.filter((t) => t.channel === channel);
  useEffect(() => {
    setTemplateId(channelTemplates[0]?.id ?? "");
  }, [channel, channelTemplates.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_ids: memberIds,
          channel,
          message_type: "template",
          template_id: templateId,
          triggerDays: 14,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl mx-4 max-w-lg w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Run play on {memberCount} member{memberCount !== 1 ? "s" : ""}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <div className="flex gap-2">
              {(["email", "sms"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    channel === c ? "bg-lime-500 text-gray-900" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {c === "email" ? "Email" : "SMS"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select template...</option>
              {channelTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !templateId}
              className="flex-1 rounded-md bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
