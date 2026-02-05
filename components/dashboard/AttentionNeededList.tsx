"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardMetricsData } from "@/components/dashboard/DashboardContent";

export type AttentionMember = DashboardMetricsData["attentionNeeded"][number];

/**
 * "Who Needs Attention Today" List
 *
 * Shows top 10 most urgent members requiring immediate action.
 * When initialData is provided (e.g. from DashboardContent), no fetch is made.
 */
export default function AttentionNeededList({
  initialData,
}: {
  initialData?: DashboardMetricsData | null;
}) {
  const [members, setMembers] = useState<AttentionMember[]>(initialData?.attentionNeeded ?? []);
  const [loading, setLoading] = useState(!initialData);

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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Who Needs Attention Today
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {members.length} member{members.length !== 1 ? "s" : ""} requiring immediate action
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {members.map((member, index) => (
          <div
            key={member.id}
            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
              member.riskLevel === "high" ? "bg-red-50/30" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Rank indicator */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {index + 1}
                </div>

                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">
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
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
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
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                <Link
                  href={`/members/${member.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-900"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length >= 10 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/members/at-risk"
            className="text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            View all at-risk members →
          </Link>
        </div>
      )}
    </div>
  );
}
