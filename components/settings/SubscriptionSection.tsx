"use client";

import { useState } from "react";
import { getPlanDisplayName, getPlanPriceLabel, type PlanId } from "@/lib/pricing";

interface Gym {
  id: string;
  name: string;
  subscription_status: string;
  trial_ends_at?: string | null;
  stripe_customer_id?: string | null;
  plan_id?: string | null;
}

interface SubscriptionSectionProps {
  gym: Gym | null;
}

export default function SubscriptionSection({ gym }: SubscriptionSectionProps) {
  const [loading, setLoading] = useState<"checkout" | "portal" | PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planId: "starter_49" | "growth_79") => {
    setError(null);
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/create-portal-session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  if (!gym) return null;

  const planId = gym.plan_id as PlanId | null | undefined;
  const planName = getPlanDisplayName(planId);
  const planPrice = getPlanPriceLabel(planId);

  return (
    <section id="subscription" className="scroll-mt-24">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Subscription & Billing
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Manage your Rip plan and payment method
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {gym.subscription_status === "past_due" && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Your payment failed. Update your payment method to avoid losing
              access.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={loading !== null}
              className="mt-3 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {loading === "portal" ? "Opening…" : "Update payment method"}
            </button>
          </div>
        )}

        {gym.subscription_status === "active" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Active
              </span>
              <span className="text-sm text-gray-600">
                {planName} plan · {planPrice || "Paid subscription"}
              </span>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={loading !== null}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading === "portal" ? "Opening…" : "Manage subscription"}
            </button>
          </div>
        )}

        {gym.subscription_status !== "active" && gym.subscription_status !== "past_due" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                No active subscription
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Subscribe to track at-risk members, run retention campaigns, and
              prove what works. Or{" "}
              <a href="/audit" className="text-lime-700 hover:underline">
                request a free retention audit
              </a>{" "}
              first.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleUpgrade("starter_49")}
                disabled={loading !== null}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                {loading === "starter_49" ? "Redirecting…" : "Start Starter — £49/mo per location"}
              </button>
              <button
                onClick={() => handleUpgrade("growth_79")}
                disabled={loading !== null}
                className="rounded-md bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-500 disabled:opacity-50"
              >
                {loading === "growth_79" ? "Redirecting…" : "Start Growth — £79/mo per location"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
