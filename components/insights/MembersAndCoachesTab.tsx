"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MemberInsight {
  id: string;
  name: string;
  email: string | null;
  visitsLast30Days?: number;
  commitmentScore: number;
  churnRiskLevel: string;
  daysSinceLastVisit: number | null;
}

interface CoachInsight {
  coachId: string;
  name: string;
  touchesLast30Days: number;
  atRiskAssigned: number;
}

export default function MembersAndCoachesTab() {
  const [bestMembers, setBestMembers] = useState<MemberInsight[]>([]);
  const [worstMembers, setWorstMembers] = useState<MemberInsight[]>([]);
  const [coachPerformance, setCoachPerformance] = useState<CoachInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/members-and-coaches")
      .then((r) => r.json())
      .then((data) => {
        setBestMembers(data.bestMembers ?? []);
        setWorstMembers(data.worstMembers ?? []);
        setCoachPerformance(data.coachPerformance ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Loading member and coach insights...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Your best members</h3>
          <p className="text-xs text-gray-500 mb-4">
            Members who visit the most - strongest habit formation.
          </p>
          {bestMembers.length === 0 ? (
            <p className="text-sm text-gray-500">No visit data in the last 30 days.</p>
          ) : (
            <ul className="space-y-2">
              {bestMembers.map((m, i) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-lime-100 text-lime-800 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <Link href={`/members/${m.id}`} className="text-sm font-medium text-lime-600 hover:underline">
                      {m.name}
                    </Link>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{m.visitsLast30Days ?? 0} visits (30d)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Members needing attention</h3>
          <p className="text-xs text-gray-500 mb-4">
            At-risk or low-engagement members. Prioritise outreach before they churn.
          </p>
          {worstMembers.length === 0 ? (
            <p className="text-sm text-gray-500">No at-risk members right now.</p>
          ) : (
            <ul className="space-y-2">
              {worstMembers.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/30 px-3 py-2">
                  <Link href={`/members/${m.id}`} className="text-sm font-medium text-rose-700 hover:underline">
                    {m.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      m.churnRiskLevel === "high" ? "bg-red-100 text-red-800" :
                      m.churnRiskLevel === "medium" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                    }`}>
                      {m.churnRiskLevel}
                    </span>
                    {m.daysSinceLastVisit !== null && (
                      <span className="text-xs text-gray-500">{m.daysSinceLastVisit}d since visit</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/members/at-risk"
            className="mt-3 inline-block text-sm font-medium text-lime-600 hover:text-lime-800"
          >
            View all at-risk members →
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Coach performance</h3>
          <p className="text-xs text-gray-500 mb-4">
            Touches in last 30 days. At-risk assigned = members flagged for attention.
          </p>
          {coachPerformance.length === 0 ? (
            <p className="text-sm text-gray-500">No coach data yet.</p>
          ) : (
            <div className="space-y-3">
              {coachPerformance.map((c) => (
                <div
                  key={c.coachId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      <strong>{c.touchesLast30Days}</strong> touches
                    </span>
                    <span className="text-sm text-gray-500">
                      <strong>{c.atRiskAssigned}</strong> at-risk assigned
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/coach-accountability"
            className="mt-3 inline-block text-sm font-medium text-lime-600 hover:text-lime-800"
          >
            Coach accountability →
          </Link>
        </div>
      </div>
    </>
  );
}
