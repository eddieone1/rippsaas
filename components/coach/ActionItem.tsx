"use client";

import { useState } from "react";
import Link from "next/link";
import { getActionTypeInfo } from "@/lib/coach-actions/generate";

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

interface ActionItemProps {
  action: Action;
  onComplete: (actionId: string) => void;
}

/**
 * Action Item Component
 * 
 * Simple task UI - just the essentials:
 * - What to do
 * - Who it's for
 * - Mark complete button
 */
export default function ActionItem({ action, onComplete }: ActionItemProps) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const actionInfo = getActionTypeInfo(action.actionType);
  const priorityColors = {
    high: "border-red-300 bg-red-50",
    medium: "border-yellow-300 bg-yellow-50",
    low: "border-gray-300 bg-gray-50",
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coach/actions/${action.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notes || undefined }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete action");
      }

      onComplete(action.id);
    } catch (err) {
      console.error("Failed to complete action:", err);
    } finally {
      setLoading(false);
      setShowNotes(false);
      setNotes("");
    }
  };

  if (action.completedAt) {
    return null; // Don't show completed actions
  }

  return (
    <div
      className={`rounded-lg border ${priorityColors[action.priority]} p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Action Type Badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">{actionInfo.icon}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${actionInfo.color}`}
            >
              {actionInfo.label}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                action.priority === "high"
                  ? "bg-red-200 text-red-900"
                  : action.priority === "medium"
                  ? "bg-yellow-200 text-yellow-900"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {action.priority.toUpperCase()}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {action.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3">{action.description}</p>

          {/* Member Link */}
          <Link
            href={`/members/${action.memberId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            View {action.memberName} →
          </Link>

          {/* Notes Input (optional) */}
          {showNotes && (
            <div className="mt-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Complete Button */}
        <div className="flex-shrink-0">
          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark Complete
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Completing..." : "Confirm"}
              </button>
              <button
                onClick={() => {
                  setShowNotes(false);
                  setNotes("");
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
