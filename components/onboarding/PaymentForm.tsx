"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/payment", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start trial");
        setLoading(false);
        return;
      }

      // Trial is automatically started (no Stripe Checkout in MVP)
      // For MVP, we'll skip actual payment and just mark trial as started
      router.push("/onboarding/welcome");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900">Free Trial</h3>
          <p className="mt-2 text-sm text-gray-600">
            14 days free, then £29/month
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-gray-600">
            <li className="flex items-center">
              <svg
                className="mr-2 h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Member retention dashboard
            </li>
            <li className="flex items-center">
              <svg
                className="mr-2 h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Automated email campaigns
            </li>
            <li className="flex items-center">
              <svg
                className="mr-2 h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unlimited member imports
            </li>
          </ul>
        </div>
      </div>

      <div>
        <button
          onClick={handleStartTrial}
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Starting trial..." : "Start 14-day trial"}
        </button>
      </div>
    </div>
  );
}
