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
      // Redirect directly to dashboard after onboarding completion
      // Use window.location for a hard redirect to ensure fresh server-side data
      window.location.href = "/dashboard";
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-md bg-red-500/20 border border-red-500/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white">Free Trial</h3>
          <p className="mt-2 text-sm text-white/80">
            14 days free, then £99/month (Starter plan)
          </p>
          <p className="mt-1 text-xs text-white/50">Pays for itself by saving 2–3 members per month</p>
          <ul className="mt-4 space-y-2 text-left text-sm text-white/80">
            <li className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-[#9EFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Member retention dashboard
            </li>
            <li className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-[#9EFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Automated email &amp; SMS plays
            </li>
            <li className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-[#9EFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Prove which interventions work
            </li>
            <li className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-[#9EFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          className="w-full rounded-lg bg-[#9EFF00] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#9EFF00] disabled:opacity-50"
        >
          {loading ? "Starting trial..." : "Start 14-day trial"}
        </button>
      </div>
    </div>
  );
}
