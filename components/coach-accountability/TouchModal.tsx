"use client";

import { useState } from "react";
import type { TouchChannel, TouchOutcome } from "./types";

const CHANNELS: { value: TouchChannel; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "in_person", label: "In person" },
  { value: "dm", label: "DM" },
];

const OUTCOMES: { value: TouchOutcome; label: string }[] = [
  { value: "replied", label: "Replied" },
  { value: "booked", label: "Booked" },
  { value: "no_response", label: "No response" },
  { value: "follow_up", label: "Follow-up" },
  { value: "declined", label: "Declined" },
];

interface TouchModalProps {
  memberId: string;
  memberName: string;
  coachId: string;
  onClose: () => void;
  onSubmit: (payload: {
    memberId: string;
    coachId: string;
    channel: TouchChannel;
    outcome: TouchOutcome;
    notes?: string;
  }) => boolean | Promise<boolean>;
}

export default function TouchModal({
  memberId,
  memberName,
  coachId,
  onClose,
  onSubmit,
}: TouchModalProps) {
  const [channel, setChannel] = useState<TouchChannel>("sms");
  const [outcome, setOutcome] = useState<TouchOutcome>("replied");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onSubmit({
        memberId,
        coachId,
        channel,
        outcome,
        notes: notes.trim() || undefined,
      });
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Log touch</h3>
        <p className="mt-1 text-sm font-medium text-gray-800">{memberName}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Channel
            </label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setChannel(c.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    channel === c.value
                      ? "border-lime-500 bg-lime-50 text-lime-700"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Outcome
            </label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(o.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    outcome === o.value
                      ? "border-lime-500 bg-lime-50 text-lime-700"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 120))}
              placeholder="Max 120 chars"
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-600 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
            <p className="mt-1 text-right text-xs text-gray-700">{notes.length}/120</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-lime-500 py-2 text-sm font-semibold text-white hover:bg-lime-600 disabled:opacity-50"
            >
              Log touch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
