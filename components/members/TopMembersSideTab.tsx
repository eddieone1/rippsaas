"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TopMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  commitmentScore: number;
}

interface TopMembersSideTabProps {
  gymId: string;
}

export default function TopMembersSideTab({ gymId }: TopMembersSideTabProps) {
  const [members, setMembers] = useState<TopMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPositiveOutreach, setShowPositiveOutreach] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TopMember | null>(null);

  useEffect(() => {
    fetchTopMembers();
  }, [gymId]);

  const fetchTopMembers = async () => {
    try {
      const res = await fetch("/api/members/top-members");
      const data = await res.json();
      setMembers(data.topMembers ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Habit Champions</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Habit Champions</h3>
        <p className="text-sm text-gray-500">No members with sufficient habit data yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Habit Champions</h3>
        <p className="text-xs text-gray-500 mb-4">Most consistent · celebrate and learn from your strongest members</p>
        <ul className="space-y-2">
          {members.map((m, idx) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-6 h-6 rounded-full bg-lime-100 text-lime-800 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <Link
                  href={`/members/${m.id}`}
                  className="text-sm font-medium text-gray-900 truncate hover:text-lime-600"
                >
                  {m.firstName} {m.lastName}
                </Link>
              </div>
              <span className="shrink-0 text-xs font-semibold text-lime-600">{m.commitmentScore}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <button
            type="button"
            onClick={() => setShowPositiveOutreach(true)}
            className="w-full rounded-md bg-lime-100 px-3 py-2 text-sm font-medium text-lime-800 hover:bg-lime-200"
          >
            Positive reinforcement outreach
          </button>
          <Link
            href="/plays"
            className="block w-full rounded-md border border-lime-300 bg-lime-50 px-3 py-2 text-sm font-medium text-lime-900 text-center hover:bg-lime-100"
          >
            Send praise / rewards campaign
          </Link>
        </div>
      </div>

      {/* Positive reinforcement modal */}
      {showPositiveOutreach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Positive Reinforcement</h3>
            <p className="text-sm text-gray-600 mb-4">
              Celebrate your top members with a quick message of recognition. Choose a member or send to all.
            </p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <input
                    type="radio"
                    name="positiveMember"
                    checked={selectedMember?.id === m.id}
                    onChange={() => setSelectedMember(m)}
                  />
                  <span className="text-sm">
                    {m.firstName} {m.lastName} <span className="text-lime-600">({m.commitmentScore})</span>
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name="positiveMember"
                  checked={!selectedMember}
                  onChange={() => setSelectedMember(null)}
                />
                <span className="text-sm">All top 5 members</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Link
                href={
                  selectedMember
                    ? `/plays?champion=${selectedMember.id}`
                    : "/plays?champion=top5"
                }
                className="flex-1 rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 text-center"
              >
                Send praise campaign
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowPositiveOutreach(false);
                  setSelectedMember(null);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
