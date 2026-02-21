"use client";

import { useState } from "react";

export interface MemberActionsMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface MemberActionsProps {
  member: MemberActionsMember;
  onActionComplete?: () => void;
}

export default function MemberActions({ member, onActionComplete }: MemberActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [visitDate, setVisitDate] = useState("");

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setError(null);
    setSuccess(null);
    setLoading(action);

    try {
      const response = await fetch(`/api/members/${member.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to perform action");
        setLoading(null);
        return;
      }

      if (action === "send-email") {
        setSuccess("Email sent successfully!");
        setShowEmailModal(false);
      } else if (action === "update-last-visit") {
        setSuccess("Last visit date updated!");
        setShowDateInput(false);
        setVisitDate("");
      }

      setTimeout(() => {
        onActionComplete?.();
        setLoading(null);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Action error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(null);
    }
  };

  const handleSendEmail = (emailType: "we_miss_you" | "bring_a_friend") => {
    handleAction("send-email", { email_type: emailType });
  };

  const handleUpdateLastVisit = () => {
    if (visitDate) {
      handleAction("update-last-visit", { last_visit_date: visitDate });
    }
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
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
        <div className="space-y-3">
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={!member.email || loading !== null}
            className="w-full rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Engagement Email
          </button>
          {!showDateInput ? (
            <button
              onClick={() => setShowDateInput(true)}
              disabled={loading !== null}
              className="w-full rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Last Visit
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
              <button
                onClick={handleUpdateLastVisit}
                disabled={!visitDate || loading !== null}
                className="rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "update-last-visit" ? "..." : "Save"}
              </button>
              <button
                onClick={() => { setShowDateInput(false); setVisitDate(""); }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEmailModal(false)} aria-hidden />
          <div className="relative rounded-lg bg-white p-6 shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Email Type</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the type of engagement email to send to {member.firstName}:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleSendEmail("we_miss_you")}
                disabled={loading === "send-email"}
                className="w-full rounded-md bg-lime-500 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="font-semibold">We Haven&apos;t Seen You in a While</div>
                <div className="text-xs text-gray-600 mt-1">
                  Friendly message to encourage them to return
                </div>
              </button>
              <button
                onClick={() => handleSendEmail("bring_a_friend")}
                disabled={loading === "send-email"}
                className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="font-semibold">Bring a Friend on Us</div>
                <div className="text-xs text-green-100 mt-1">
                  Referral offer with free guest pass
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowEmailModal(false)}
              disabled={loading === "send-email"}
              className="mt-4 w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
