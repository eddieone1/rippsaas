"use client";

import { useState, useEffect } from "react";

interface Coach {
  id: string;
  full_name: string;
  email: string;
}

interface AssignCoachModalProps {
  memberIds: string[];
  memberCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignCoachModal({
  memberIds,
  memberCount,
  onClose,
  onSuccess,
}: AssignCoachModalProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/staff")
      .then((r) => r.json())
      .then((d) => {
        const list = d.staff ?? [];
        const coachList = list.filter((m: { role?: string }) => m.role === "coach");
        setCoaches(coachList);
        setCoachId(coachList[0]?.id ?? "");
      })
      .catch(() => setCoaches([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/members/bulk-assign-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds, coachId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl mx-4 max-w-lg w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Assign coach to {memberCount} member{memberCount !== 1 ? "s" : ""}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select coach...</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
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
              disabled={loading || !coachId || coaches.length === 0}
              className="flex-1 rounded-md bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50"
            >
              {loading ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
