"use client";

import { useState, useEffect } from "react";
import ActionItem from "./ActionItem";

interface Action {
  id: string;
  memberId: string;
  memberName: string;
  actionType: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  completedAt: string | null;
  notes: string | null;
}

/**
 * Coach Inbox Component
 * 
 * Simple task list - no dashboards, no analytics, just actions.
 * Shows incomplete actions for today.
 */
export default function CoachInbox() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coach/actions");
      if (!response.ok) {
        throw new Error("Failed to fetch actions");
      }
      const data = await response.json();
      setActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load actions");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (actionId: string) => {
    // Remove completed action from list
    setActions((prev) => prev.filter((a) => a.id !== actionId));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          All caught up!
        </h3>
        <p className="text-sm text-gray-600">
          You have no actions for today. Check back tomorrow for new tasks.
        </p>
      </div>
    );
  }

  // Group by priority
  const highPriority = actions.filter((a) => a.priority === "high");
  const mediumPriority = actions.filter((a) => a.priority === "medium");
  const lowPriority = actions.filter((a) => a.priority === "low");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{actions.length}</span>{" "}
          action{actions.length !== 1 ? "s" : ""} for today
        </p>
      </div>

      {/* High Priority Actions */}
      {highPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            High Priority ({highPriority.length})
          </h2>
          <div className="space-y-3">
            {highPriority.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Actions */}
      {mediumPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Medium Priority ({mediumPriority.length})
          </h2>
          <div className="space-y-3">
            {mediumPriority.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Actions */}
      {lowPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Low Priority ({lowPriority.length})
          </h2>
          <div className="space-y-3">
            {lowPriority.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
