"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Gym {
  id: string;
  name?: string;
  sender_name?: string | null;
  sender_email?: string | null;
  sms_from_number?: string | null;
}

export default function SenderIdentitySection({ gym }: { gym: Gym | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [senderName, setSenderName] = useState(gym?.sender_name ?? "");
  const [senderEmail, setSenderEmail] = useState(gym?.sender_email ?? "");
  const [smsFromNumber, setSmsFromNumber] = useState(gym?.sms_from_number ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: senderName.trim() || null,
          sender_email: senderEmail.trim() || null,
          sms_from_number: smsFromNumber.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setSuccess("Sender settings saved.");
      router.refresh();
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-white/10 dark:bg-white/5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Outreach sender</h2>
      <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
        Set the email address and display name for outreach emails, and the phone number for SMS.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/20 p-3 text-sm text-red-200">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-500/20 p-3 text-sm text-green-200">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Sender name (emails)</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="e.g. Acme Gym"
            className="w-full rounded-md border border-gray-300 dark:border-white/20 dark:bg-white/10 dark:text-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">From email address</label>
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="e.g. hello@acmegym.com"
            className="w-full rounded-md border border-gray-300 dark:border-white/20 dark:bg-white/10 dark:text-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">SMS from number (optional)</label>
          <input
            type="text"
            value={smsFromNumber}
            onChange={(e) => setSmsFromNumber(e.target.value)}
            placeholder="e.g. +1234567890"
            className="w-full rounded-md border border-gray-300 dark:border-white/20 dark:bg-white/10 dark:text-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--rip-black)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save sender settings"}
        </button>
      </form>
    </div>
  );
}
