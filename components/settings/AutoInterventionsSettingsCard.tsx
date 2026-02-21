"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Prominent auto-interventions toggle in Settings.
 * Links to campaigns for full approval queue.
 */
export default function AutoInterventionsSettingsCard() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/settings/auto-interventions")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.enabled != null) setEnabled(json.data.enabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    const newValue = !enabled;
    try {
      const res = await fetch("/api/settings/auto-interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue }),
      });
      if (res.ok) setEnabled(newValue);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-lime-200 bg-lime-50/50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Automated interventions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Daily outreach for at-risk members. Every intervention requires approval before sending. Core to retention impact.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {loading ? (
            <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={toggling}
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 ${
                enabled ? "bg-lime-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          )}
          <Link
            href="/plays"
            className="text-sm font-medium text-lime-600 hover:text-lime-800"
          >
            View plays →
          </Link>
        </div>
      </div>
    </div>
  );
}
