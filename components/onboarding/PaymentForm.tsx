"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trackOnboardingEvent } from "@/lib/analytics";
import { PLANS, type PlanId } from "@/lib/pricing";

type PaidPlanId = "starter_49" | "growth_79";

export default function PaymentForm() {
  const [loading, setLoading] = useState<PaidPlanId | "audit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackOnboardingEvent("onboarding_payment_started");
  }, []);

  const handleSelectPlan = async (planId: PlanId) => {
    setError(null);
    setLoading(planId === "free_audit" ? "audit" : planId);

    try {
      const response = await fetch("/api/onboarding/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to continue");
        setLoading(null);
        return;
      }

      trackOnboardingEvent("onboarding_payment_completed", { planId });

      if (planId === "free_audit") {
        window.location.href = "/audit?submitted=1";
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      window.location.href = "/onboarding/upload";
    } catch {
      setError("An unexpected error occurred");
      setLoading(null);
    }
  };

  const starter = PLANS.starter_49;
  const growth = PLANS.growth_79;

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-md bg-red-500/20 border border-red-500/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-dashed border-[#9EFF00]/40 bg-[#9EFF00]/5 p-5">
        <h3 className="text-lg font-bold text-white">Free Retention Audit</h3>
        <p className="mt-1 text-sm text-white/70">
          Not ready to subscribe? Request a free audit of your at-risk members — no card
          required.
        </p>
        <Link
          href="/audit"
          className="mt-4 inline-block text-sm font-medium text-[#9EFF00] hover:underline"
        >
          Request your free audit →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-5 flex flex-col">
          <h3 className="text-lg font-bold text-white">{starter.name}</h3>
          <p className="mt-1 text-2xl font-bold text-white">
            {starter.priceLabel}
            <span className="text-sm font-normal text-white/55">/mo per location</span>
          </p>
          <p className="mt-2 text-xs text-white/55 flex-1">{starter.description}</p>
          <button
            type="button"
            onClick={() => handleSelectPlan("starter_49")}
            disabled={loading !== null}
            className="mt-4 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {loading === "starter_49" ? "Redirecting…" : starter.cta}
          </button>
        </div>

        <div className="rounded-lg border border-[#9EFF00]/40 bg-white/5 p-5 flex flex-col">
          <h3 className="text-lg font-bold text-white">{growth.name}</h3>
          <p className="mt-1 text-2xl font-bold text-white">
            {growth.priceLabel}
            <span className="text-sm font-normal text-white/55">/mo per location</span>
          </p>
          <p className="mt-2 text-xs text-white/55 flex-1">{growth.description}</p>
          <button
            type="button"
            onClick={() => handleSelectPlan("growth_79")}
            disabled={loading !== null}
            className="mt-4 w-full rounded-lg bg-[#9EFF00] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {loading === "growth_79" ? "Redirecting…" : growth.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
