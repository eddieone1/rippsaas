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
 * Clickable assigned coach opens modal: reassign or nudge.
 */
export default function CoachAssignment({
  memberId,
  currentCoach,
  availableCoaches,
  onAssign,
}: CoachAssignmentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAssign = async (coachId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/members/${memberId}/assign-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to assign coach");
        setLoading(false);
        return;
      }

      setSuccess("Coach assigned successfully!");
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
        onAssign?.();
        window.location.reload();
      }, 1000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleNudge = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/members/${memberId}/nudge-coach`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send nudge");
        setLoading(false);
        return;
      }

      setSuccess("Nudge sent to coach!");
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Coach</h3>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {currentCoach ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 hover:border-lime-300 transition-colors cursor-pointer"
          >
            <p className="text-sm font-semibold text-gray-900">{currentCoach.name}</p>
            <p className="text-xs text-gray-600">{currentCoach.email}</p>
            {currentCoach.assignedBy && (
              <p className="text-xs text-gray-500 mt-1">Assigned by {currentCoach.assignedBy}</p>
            )}
            <p className="text-xs text-lime-600 mt-2">Click to reassign or nudge →</p>
          </button>
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
                    <span className="text-xs text-green-600 font-semibold">Current</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {availableCoaches.length === 0 && (
        <p className="text-sm text-gray-500">No coaches available. Add coaches in settings.</p>
      )}

      {/* Coach modal: reassign or nudge */}
      {modalOpen && currentCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assigned Coach</h3>
            <p className="text-sm text-gray-600 mb-4">
              {currentCoach.name} — {currentCoach.email}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleNudge}
                disabled={loading}
                className="w-full rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-medium text-lime-800 hover:bg-lime-100 disabled:opacity-50"
              >
                Send nudge to coach
              </button>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Reassign to another coach</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableCoaches
                    .filter((c) => c.id !== currentCoach.id)
                    .map((coach) => (
                      <button
                        key={coach.id}
                        onClick={() => handleAssign(coach.id)}
                        disabled={loading}
                        className="w-full rounded border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        {coach.full_name}
                      </button>
                    ))}
                  {availableCoaches.filter((c) => c.id !== currentCoach.id).length === 0 && (
                    <p className="text-xs text-gray-500">No other coaches available</p>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
