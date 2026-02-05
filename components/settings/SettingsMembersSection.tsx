"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsMembersSection() {
  const [clearing, setClearing] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClearClick = () => setShowConfirm(true);

  const handleClearConfirm = async () => {
    if (confirmText.toLowerCase() !== "delete all") return;
    setClearing(true);
    setError(null);
    try {
      const res = await fetch("/api/members/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to clear members");
        setClearing(false);
        return;
      }
      setShowConfirm(false);
      setConfirmText("");
      setClearing(false);
      window.location.href = "/members";
    } catch (e) {
      setError("An unexpected error occurred");
      setClearing(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload or update member data from CSV. Data from each upload is merged with existing data for rolling analysis.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/members/upload"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload CSV
        </Link>
        <button
          type="button"
          onClick={handleClearClick}
          className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Clear all members
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      {showConfirm && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800 mb-2">
            This will permanently delete all members and their visit data for this gym. Type <strong>delete all</strong> to confirm.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete all"
            className="mb-3 w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClearConfirm}
              disabled={confirmText.toLowerCase() !== "delete all" || clearing}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {clearing ? "Clearing..." : "Confirm clear all"}
            </button>
            <button
              type="button"
              onClick={() => { setShowConfirm(false); setConfirmText(""); setError(null); }}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
