"use client";

interface RiskFlags {
  noRecentVisits: boolean;
  rapidDecline: boolean;
  largeGap: boolean;
  inconsistentPattern: boolean;
  newMemberLowAttendance: boolean;
  decliningFrequency: boolean;
}

interface RiskFlagsProps {
  flags: RiskFlags;
}

/**
 * Risk Flags Component
 * 
 * Visual indicators for specific commitment issues
 * Helps coaches understand what's wrong
 */
export default function RiskFlags({ flags }: RiskFlagsProps) {
  const activeFlags = Object.entries(flags).filter(([_, value]) => value);

  if (activeFlags.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-900">
              No Risk Flags
            </p>
            <p className="text-xs text-green-700">
              Member showing healthy engagement patterns
            </p>
          </div>
        </div>
      </div>
    );
  }

  const flagLabels: Record<string, { label: string; description: string; icon: string }> = {
    noRecentVisits: {
      label: "No Recent Visits",
      description: "No visits in last 14 days",
      icon: "🚫",
    },
    rapidDecline: {
      label: "Rapid Decline",
      description: "Attendance dropped >50% in last 30 days",
      icon: "📉",
    },
    largeGap: {
      label: "Large Gap",
      description: "Gap >21 days between visits",
      icon: "⏸️",
    },
    inconsistentPattern: {
      label: "Inconsistent Pattern",
      description: "High variance in visit frequency",
      icon: "📊",
    },
    newMemberLowAttendance: {
      label: "New Member Low Attendance",
      description: "<30 days old, <2 visits",
      icon: "🆕",
    },
    decliningFrequency: {
      label: "Declining Frequency",
      description: "Visit frequency declining >0.5/week",
      icon: "⬇️",
    },
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Risk Flags ({activeFlags.length})
      </h4>
      {activeFlags.map(([key, _]) => {
        const flag = flagLabels[key];
        if (!flag) return null;

        return (
          <div
            key={key}
            className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
          >
            <span className="text-lg">{flag.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900">
                {flag.label}
              </p>
              <p className="text-xs text-yellow-700">{flag.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
