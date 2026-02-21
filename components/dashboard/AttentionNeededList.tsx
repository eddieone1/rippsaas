"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardMetricsData } from "@/components/dashboard/DashboardContent";

export type AttentionMember = DashboardMetricsData["attentionNeeded"][number];

interface AttentionNeededListProps {
  initialData?: DashboardMetricsData | null;
  onActionComplete?: () => void;
}

/**
 * "Who Needs Attention Today" List
 *
 * Shows top 10 most urgent members requiring immediate action.
 * Quick actions: Send email (without leaving the dashboard).
 * When initialData is provided (e.g. from DashboardContent), no fetch is made.
 */
export default function AttentionNeededList({
  initialData,
  onActionComplete,
}: AttentionNeededListProps) {
  const [members, setMembers] = useState<AttentionMember[]>(initialData?.attentionNeeded ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.attentionNeeded) {
      setMembers(initialData.attentionNeeded);
      setLoading(false);
      return;
    }
    fetchAttentionNeeded();
  }, [initialData]);

  const fetchAttentionNeeded = async () => {
    try {
      const response = await fetch("/api/dashboard/metrics");
      if (!response.ok) return;
      const metrics = await response.json();
      setMembers(metrics.attentionNeeded || []);
    } catch (err) {
      console.error("Failed to fetch attention needed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          All clear!
        </h3>
        <p className="text-sm text-gray-600">
          No members need immediate attention right now.
        </p>
      </div>
    );
  }

  const handleQuickSendEmail = async (memberId: string, emailType: "we_miss_you" | "bring_a_friend") => {
    setSendingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_type: emailType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      onActionComplete?.();
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, engagedToday: true } : m))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm" data-tour="members-table">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Who Needs Attention Today
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {members.length} member{members.length !== 1 ? "s" : ""} requiring immediate action
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {members.map((member, index) => {
          const engagedToday = (member as AttentionMember & { engagedToday?: boolean }).engagedToday ?? false;
          return (
          <div
            key={member.id}
            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
              member.riskLevel === "high" && !engagedToday ? "bg-red-50/30" : ""
            } ${engagedToday ? "bg-green-50/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Rank indicator */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  engagedToday ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {engagedToday ? "✓" : index + 1}
                </div>

                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold truncate ${
                      engagedToday ? "line-through decoration-green-600 decoration-2 text-green-700" : "text-gray-900"
                    }`}>
                      {member.name}
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${getRiskBadgeColor(
                        member.riskLevel
                      )}`}
                    >
                      {member.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className={`mt-1 flex items-center gap-4 text-xs ${
                    engagedToday ? "text-green-600" : "text-gray-600"
                  }`}>
                    {engagedToday ? (
                      <span className="font-medium">Engaged today</span>
                    ) : (
                      <>
                        {member.daysSinceLastVisit !== null ? (
                          <span>
                            {member.daysSinceLastVisit} day
                            {member.daysSinceLastVisit !== 1 ? "s" : ""} inactive
                          </span>
                        ) : (
                          <span>Never visited</span>
                        )}
                        <span>•</span>
                        <span>Risk: {member.riskScore}/100</span>
                        <span>•</span>
                        <span className="font-medium text-gray-900">
                          £{member.monthlyRevenue}/mo
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!engagedToday && (
                  <div className="relative group">
                    <button
                      type="button"
                      disabled={sendingId === member.id}
                      onClick={() => handleQuickSendEmail(member.id, "we_miss_you")}
                      className="rounded-md bg-lime-500 px-2.5 py-1 text-xs font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
                    >
                      {sendingId === member.id ? "…" : "Email"}
                    </button>
                  </div>
                )}
                <Link
                  href={`/members/${member.id}?from=dashboard`}
                  className="text-sm font-medium text-lime-600 hover:text-lime-800"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {members.length >= 10 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/members/at-risk"
            className="text-sm font-medium text-lime-600 hover:text-lime-800"
          >
            View all at-risk members →
          </Link>
        </div>
      )}
    </div>
  );
}
