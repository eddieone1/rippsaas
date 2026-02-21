"use client";

import { format } from "date-fns";

interface EngagementEvent {
  type: "visit" | "campaign" | "coach_touch";
  date: string;
  title: string;
  description: string;
  metadata?: {
    channel?: string;
    reEngaged?: boolean;
    outcome?: string;
    activityType?: string;
    coachName?: string;
  };
}

interface EngagementHistoryProps {
  events: EngagementEvent[];
}

/**
 * Engagement History Component
 * 
 * Chronological timeline of member engagement:
 * - Visits
 * - Campaigns sent
 * - Reengagement events
 */
export default function EngagementHistory({ events }: EngagementHistoryProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-600">No engagement history yet</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "visit":
        return "🏋️";
      case "campaign":
        return "📧";
      case "coach_touch":
        return "👤";
      default:
        return "•";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "visit":
        return "bg-green-100 text-green-800";
      case "campaign":
        return "bg-lime-100 text-lime-800";
      case "coach_touch":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Engagement History
      </h3>

      <div className="space-y-4">
        {events.slice(0, 20).map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${getEventColor(
                  event.type
                )}`}
              >
                {getEventIcon(event.type)}
              </div>
              {index < events.length - 1 && (
                <div className="h-full w-0.5 bg-gray-200"></div>
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-600">{event.description}</p>
                  {event.metadata?.reEngaged && (
                    <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      Visited again
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900">
                    {format(new Date(event.date), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(event.date), "h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > 20 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Showing last 20 events of {events.length} total
          </p>
        </div>
      )}
    </div>
  );
}
