"use client";

import { useState } from "react";
import type { Member, Coach } from "./mission-control-types";
import type { InteractionType, InteractionOutcome } from "./mission-control-types";

const CHANNELS: { value: InteractionType; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "in_person", label: "In person" },
];

const OUTCOMES: { value: InteractionOutcome; label: string }[] = [
  { value: "rebooked", label: "Rebooked" },
  { value: "attended_next", label: "Attended next" },
  { value: "no_response", label: "No response" },
  { value: "still_at_risk", label: "Still at risk" },
  { value: "freeze_requested", label: "Freeze requested" },
  { value: "cancelled", label: "Cancelled" },
];

type ActionType = "message" | "call" | "schedule" | "note";

interface LogInteractionModalProps {
  member: Member;
  currentCoachId: string;
  actionType: ActionType;
  onClose: () => void;
  onSubmit: (payload: {
    memberId: string;
    coachId: string;
    type: InteractionType;
    notes: string;
    outcome?: InteractionOutcome;
    followUpDate?: string;
  }) => void;
}

export default function LogInteractionModal({
  member,
  currentCoachId,
  actionType,
  onClose,
  onSubmit,
}: LogInteractionModalProps) {
  const [type, setType] = useState<InteractionType>(
    actionType === "call" ? "call" : actionType === "schedule" ? "in_person" : "sms"
  );
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<InteractionOutcome>("no_response");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title =
    actionType === "message"
      ? "Send Message"
      : actionType === "call"
        ? "Call Member"
        : actionType === "schedule"
          ? "Schedule Session"
          : "Add Note";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      onSubmit({
        memberId: member.id,
        coachId: currentCoachId,
        type,
        notes,
        outcome,
        followUpDate: followUpDate || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm font-medium text-gray-800">{member.name}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {actionType !== "note" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">Channel</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setType(c.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      type === c.value ? "border-lime-500 bg-lime-50 text-lime-700" : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              {actionType === "note" ? "Notes" : "Notes / message"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={actionType === "note" ? "Add note..." : "Message content..."}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Outcome</label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(o.value)}
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    outcome === o.value ? "border-lime-500 bg-lime-50 text-lime-800" : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Follow-up date (optional)</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-lime-500 py-2 text-sm font-semibold text-white hover:bg-lime-600 disabled:opacity-50">
              Log interaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
