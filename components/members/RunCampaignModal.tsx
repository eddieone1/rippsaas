"use client";

import { useState, useEffect } from "react";

export interface RunCampaignMember {
  id: string;
  firstName: string;
  lastName: string;
  lastVisitDate: string | null;
  email: string | null;
  phone: string | null;
}

interface RunCampaignModalProps {
  open: boolean;
  onClose: () => void;
  member: RunCampaignMember;
  gymName?: string;
  onSent?: () => void;
}

const DEFAULT_SUBJECT = "We haven't seen you in a while, {{first_name}}!";
const DEFAULT_BODY = `Hi {{first_name}},

We've noticed you haven't been to {{gym_name}} recently (last visit: {{last_visit_date}}), and we wanted to check in. We miss having you around!

Our doors are always open, and we'd love to welcome you back. Whether you're ready to jump back into your routine or just want to catch up, we're here for you.

See you soon,
The team at {{gym_name}}`;

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return "a while ago";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "a while ago";
  }
}

export default function RunCampaignModal({
  open,
  onClose,
  member,
  gymName = "your gym",
  onSent,
}: RunCampaignModalProps) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEmail = !!member.email?.trim();
  const hasPhone = !!member.phone?.trim();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubject(DEFAULT_SUBJECT.replace(/\{\{first_name\}\}/gi, member.firstName));
    setBody(
      DEFAULT_BODY.replace(/\{\{first_name\}\}/gi, member.firstName)
        .replace(/\{\{gym_name\}\}/gi, gymName)
        .replace(/\{\{last_visit_date\}\}/gi, formatLastVisit(member.lastVisitDate))
    );
    setChannel(hasEmail ? "email" : hasPhone ? "sms" : "email");
  }, [open, member.firstName, member.lastVisitDate, gymName, hasEmail, hasPhone]);

  const handleSend = async () => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/campaigns/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_ids: [member.id],
          triggerDays: 14,
          channel,
          message_type: "custom",
          custom_subject: subject,
          custom_body: body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }
      onSent?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const canSend =
    (channel === "email" && hasEmail) || (channel === "sms" && hasPhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Send outreach – 14 days inactive
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Send to this member only. Edit the message below and confirm.
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <span className="text-xs font-medium text-gray-500">Recipient</span>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-sm text-gray-600">
              {channel === "email" ? member.email : member.phone}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Channel
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="channel"
                  checked={channel === "email"}
                  onChange={() => setChannel("email")}
                  disabled={!hasEmail}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Email</span>
                {!hasEmail && (
                  <span className="text-xs text-gray-400">(no email)</span>
                )}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="channel"
                  checked={channel === "sms"}
                  onChange={() => setChannel("sms")}
                  disabled={!hasPhone}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">SMS</span>
                {!hasPhone && (
                  <span className="text-xs text-gray-400">(no phone)</span>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="Message body"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || sending}
            className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50 disabled:pointer-events-none"
          >
            {sending ? "Sending…" : "Confirm & send"}
          </button>
        </div>
      </div>
    </div>
  );
}
