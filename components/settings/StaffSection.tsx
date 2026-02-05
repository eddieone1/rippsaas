"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function StaffSection() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [canManageStaff, setCanManageStaff] = useState(false);

  useEffect(() => {
    fetch("/api/settings/staff")
      .then((res) => {
        if (res.status === 403) {
          setStaff([]);
          setCanManageStaff(false);
          return { staff: [] };
        }
        setCanManageStaff(true);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data?.staff)) setStaff(data.staff);
      })
      .catch(() => setError("Failed to load staff"))
      .finally(() => setLoading(false));
  }, []);

  const handleInviteCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLoading(true);
    try {
      const res = await fetch("/api/organizations/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: "coach" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invite");
        return;
      }
      setInviteSuccess(`Invite sent to ${inviteEmail}. They can join via the link.`);
      setInviteEmail("");
      router.refresh();
      setStaff((prev) => (data.invite ? [...prev, { id: data.invite.id, email: data.invite.email, full_name: "", role: "coach", created_at: "" }] : prev));
    } catch {
      setInviteError("Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff</h2>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Staff</h2>
      <p className="text-sm text-gray-600 mb-4">
        Coaches and owners in your gym. This section is only visible to owners. Add coaches by inviting them by email.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {inviteError && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{inviteError}</div>
      )}
      {inviteSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{inviteSuccess}</div>
      )}

      {canManageStaff && (
        <form onSubmit={handleInviteCoach} className="mb-6 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
              Invite coach by email
            </label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="coach@example.com"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {inviteLoading ? "Sending…" : "Invite coach"}
          </button>
        </form>
      )}

      {staff.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            {canManageStaff ? "No staff yet. Invite a coach above." : "You don’t have permission to view staff."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {staff.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">{member.full_name || "No name"}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  member.role === "owner" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {member.role === "owner" ? "Owner" : "Coach"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
