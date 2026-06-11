"use client";

import { createContext, useContext } from "react";
import type { PlanAccess } from "@/lib/plan-features";

const PlanFeaturesContext = createContext<PlanAccess | null>(null);

export function PlanFeaturesProvider({
  access,
  children,
}: {
  access: PlanAccess;
  children: React.ReactNode;
}) {
  return (
    <PlanFeaturesContext.Provider value={access}>
      {children}
    </PlanFeaturesContext.Provider>
  );
}

export function usePlanFeatures(): PlanAccess {
  const ctx = useContext(PlanFeaturesContext);
  if (!ctx) {
    throw new Error("usePlanFeatures must be used within PlanFeaturesProvider");
  }
  return ctx;
}
