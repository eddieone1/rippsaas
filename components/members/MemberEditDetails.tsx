"use client";

import { useState } from "react";

interface MemberEditDetailsProps {
  memberId: string;
  email: string;
  phone: string;
  specialNotes: string;
  onSaved: () => void;
  /** When false, only show email/phone (no notes field). Use for Notes card. */
  includeNotes?: boolean;
}

export default function MemberEditDetails({
  memberId,
  email,
  phone,
  specialNotes,
  onSaved,
  includeNotes = true,
}: MemberEditDetailsProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState(email);
  const [formPhone, setFormPhone] = useState(phone);
  const [formNotes, setFormNotes] = useState(specialNotes);

  const handleOpen = () => {
    setFormEmail(email);
    setFormPhone(phone);
    setFormNotes(specialNotes);
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail.trim() || null,
          phone: formPhone.trim() || null,
          ...(includeNotes ? { special_notes: formNotes.trim() || null } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }
      setOpen(false);
      onSaved();
    } catch (e) {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-sm font-medium text-lime-600 hover:text-lime-800"
      >
        Edit details
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit member details
            </h3>
            {error && (
              <p className="mb-3 text-sm text-red-600">{error}</p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Phone number"
                />
              </div>
              {includeNotes && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Special notes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Notes about this member"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-lime-500 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
