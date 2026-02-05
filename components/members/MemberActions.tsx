"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

export default function MemberActions({ member }: { member: Member }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleAction = async (action: string, data?: any) => {
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

      // Show success message
      if (action === "send-email") {
        setSuccess("Email sent successfully!");
        setShowEmailModal(false);
      } else if (action === "mark-re-engaged") {
        setSuccess("Member marked as re-engaged!");
      } else if (action === "update-last-visit") {
        setSuccess("Last visit date updated!");
      }

      // Refresh the page after a short delay to show success message
      setTimeout(() => {
        router.refresh();
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

  const handleMarkReEngaged = () => handleAction("mark-re-engaged");
  const handleUpdateLastVisit = () => {
    const date = prompt("Enter last visit date (YYYY-MM-DD):");
    if (date) {
      handleAction("update-last-visit", { last_visit_date: date });
    }
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
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
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Engagement Email
          </button>
          <button
            onClick={handleMarkReEngaged}
            disabled={loading !== null}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "mark-re-engaged" ? "Updating..." : "Mark as Re-engaged"}
          </button>
          <button
            onClick={handleUpdateLastVisit}
            disabled={loading !== null}
            className="w-full rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "update-last-visit" ? "Updating..." : "Update Last Visit"}
          </button>
        </div>
      </div>

      {/* Email Type Selection Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Email Type</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the type of engagement email you'd like to send to {member.first_name}:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleSendEmail("we_miss_you")}
                disabled={loading === "send-email"}
                className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="font-semibold">We Haven't Seen You in a While</div>
                <div className="text-xs text-blue-100 mt-1">
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
