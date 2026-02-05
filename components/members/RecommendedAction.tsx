"use client";

import Link from "next/link";

interface RecommendedActionProps {
  action: string;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedCampaign?: string;
  memberId: string;
}

/**
 * Recommended Next Action Component
 * 
 * Shows what action should be taken next for this member
 * Based on commitment score, risk flags, and history
 */
export default function RecommendedAction({
  action,
  priority,
  reason,
  suggestedCampaign,
  memberId,
}: RecommendedActionProps) {
  const priorityStyles = {
    high: {
      border: "border-red-300",
      bg: "bg-red-50",
      text: "text-red-900",
      badge: "bg-red-100 text-red-800",
    },
    medium: {
      border: "border-yellow-300",
      bg: "bg-yellow-50",
      text: "text-yellow-900",
      badge: "bg-yellow-100 text-yellow-800",
    },
    low: {
      border: "border-blue-300",
      bg: "bg-blue-50",
      text: "text-blue-900",
      badge: "bg-blue-100 text-blue-800",
    },
  };

  const styles = priorityStyles[priority];

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-6 shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Recommended Next Action
            </h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${styles.badge}`}
            >
              {priority.toUpperCase()}
            </span>
          </div>
          <p className={`text-sm font-medium ${styles.text}`}>{action}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">{reason}</p>

      {suggestedCampaign && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href={`/campaigns?memberId=${memberId}&suggested=${encodeURIComponent(suggestedCampaign)}`}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Send {suggestedCampaign} Campaign →
          </Link>
        </div>
      )}
    </div>
  );
}
