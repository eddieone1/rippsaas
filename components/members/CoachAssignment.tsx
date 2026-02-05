"use client";

import { useState } from "react";

interface Coach {
  id: string;
  full_name: string;
  email: string;
}

interface CoachAssignmentProps {
  memberId: string;
  currentCoach: {
    id: string;
    name: string;
    email: string;
    assignedAt: string;
    assignedBy: string | null;
  } | null;
  availableCoaches: Coach[];
  onAssign?: () => void;
}

/**
 * Coach Assignment Component
 * 
 * One-click coach assignment for members
 * Shows current coach and allows quick reassignment
 */
export default function CoachAssignment({
  memberId,
  currentCoach,
  availableCoaches,
  onAssign,
}: CoachAssignmentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAssign = async (coachId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/members/${memberId}/assign-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coachId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to assign coach");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onAssign) {
          onAssign();
        }
        // Refresh page to show updated assignment
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Assigned Coach
      </h3>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">Coach assigned successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {currentCoach ? (
        <div className="mb-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              {currentCoach.name}
            </p>
            <p className="text-xs text-gray-600">{currentCoach.email}</p>
            {currentCoach.assignedBy && (
              <p className="text-xs text-gray-500 mt-1">
                Assigned by {currentCoach.assignedBy}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">No coach assigned</p>
        </div>
      )}

      {availableCoaches.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {currentCoach ? "Reassign Coach" : "Assign Coach"}
          </label>
          <div className="space-y-2">
            {availableCoaches.map((coach) => (
              <button
                key={coach.id}
                onClick={() => handleAssign(coach.id)}
                disabled={loading || (currentCoach?.id === coach.id)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{coach.full_name}</p>
                    <p className="text-xs text-gray-500">{coach.email}</p>
                  </div>
                  {currentCoach?.id === coach.id && (
                    <span className="text-xs text-green-600 font-semibold">
                      Current
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {availableCoaches.length === 0 && (
        <p className="text-sm text-gray-500">
          No coaches available. Add coaches in settings.
        </p>
      )}
    </div>
  );
}
