"use client";

import { useState } from "react";
import type { RetentionPlay, Member, Coach } from "./mission-control-types";
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

interface RunPlayModalProps {
  play: RetentionPlay;
  member: Member;
  coaches: Coach[];
  currentCoachId: string;
  onClose: () => void;
  onSend: (payload: {
    memberId: string;
    coachId: string;
    channel: InteractionType;
    message: string;
    outcome?: InteractionOutcome;
    followUpDate?: string;
    playId: string;
  }) => void;
}

export default function RunPlayModal({
  play,
  member,
  coaches,
  currentCoachId,
  onClose,
  onSend,
}: RunPlayModalProps) {
  const [channel, setChannel] = useState<InteractionType>(play.suggestedChannel);
  const [message, setMessage] = useState(
    play.templateMessage.replace("{{firstName}}", member.name.split(" ")[0] ?? "").replace("{{primaryRiskReason}}", member.riskReasons[0] ?? "recent activity")
  );
  const [outcome, setOutcome] = useState<InteractionOutcome | "">("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [showCallScript, setShowCallScript] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      onSend({
        memberId: member.id,
        coachId: currentCoachId,
        channel,
        message,
        outcome: outcome || undefined,
        followUpDate: followUpDate || undefined,
        playId: play.id,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Run Play: {play.name}</h3>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        <p className="text-sm font-medium text-gray-800">{member.name}</p>
        <p className="mt-1 text-xs text-gray-700">Category: {play.category.replace("_", " ")}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Channel</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setChannel(c.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    channel === c.value ? "border-lime-500 bg-lime-50 text-lime-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Message template</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
          </div>

          {play.callScript && (
            <div>
              <button
                type="button"
                onClick={() => setShowCallScript(!showCallScript)}
                className="text-xs font-medium text-lime-600 hover:text-lime-700"
              >
                {showCallScript ? "Hide" : "Show"} call script
              </button>
              {showCallScript && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                  {play.callScript}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Outcome (optional now)</label>
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
            <label className="mb-2 block text-xs font-medium text-gray-700">Schedule follow-up date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-lime-500 py-2 text-sm font-semibold text-white hover:bg-lime-600 disabled:opacity-50"
            >
              Send & log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
