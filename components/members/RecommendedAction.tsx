"use client";

interface RecommendedActionProps {
  action: string;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedCampaign?: string;
  memberId: string;
  /** When set, "Send X Campaign" opens this modal instead of going to campaigns page */
  onRunCampaign?: () => void;
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
  onRunCampaign,
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
      border: "border-lime-300",
      bg: "bg-lime-50",
      text: "text-lime-900",
      badge: "bg-lime-100 text-lime-800",
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
          {onRunCampaign ? (
            <button
              type="button"
              onClick={onRunCampaign}
              className="inline-flex items-center rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 transition-colors"
            >
              Send {suggestedCampaign} →
            </button>
          ) : (
            <a
              href={`/plays?memberId=${memberId}&suggested=${encodeURIComponent(suggestedCampaign)}`}
              className="inline-flex items-center rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 transition-colors"
            >
              Send {suggestedCampaign} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
