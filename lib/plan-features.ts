import type { PlanId } from "@/lib/pricing";

export type PlanFeature =
  | "core_dashboard"
  | "churn_scoring"
  | "at_risk_list"
  | "csv_upload"
  | "email_campaigns"
  | "weekly_summary"
  | "sms_campaigns"
  | "multi_location"
  | "advanced_segmentation"
  | "coach_tasks"
  | "extended_campaign_history"
  | "monthly_retention_report";

export type GymPlanInput = {
  subscription_status: string;
  plan_id?: string | null;
};

export type PlanAccess = {
  effectivePlan: PlanId | null;
  features: Record<PlanFeature, boolean>;
  isPaid: boolean;
  isGrowth: boolean;
};

const STARTER_FEATURES: PlanFeature[] = [
  "core_dashboard",
  "churn_scoring",
  "at_risk_list",
  "csv_upload",
  "email_campaigns",
  "weekly_summary",
];

const GROWTH_ONLY_FEATURES: PlanFeature[] = [
  "sms_campaigns",
  "multi_location",
  "advanced_segmentation",
  "coach_tasks",
  "extended_campaign_history",
  "monthly_retention_report",
];

const ALL_FEATURES: PlanFeature[] = [...STARTER_FEATURES, ...GROWTH_ONLY_FEATURES];

/** Days of intervention/campaign history visible on Starter */
export const STARTER_LOG_HISTORY_DAYS = 30;

export function resolveEffectivePlan(gym: GymPlanInput): PlanId | null {
  if (gym.plan_id === "free_audit") return "free_audit";
  if (gym.subscription_status !== "active") return null;

  if (gym.plan_id === "growth_79") return "growth_79";
  if (gym.plan_id === "starter_49") return "starter_49";
  // Legacy active gyms without plan_id
  return "starter_49";
}

export function buildPlanAccess(gym: GymPlanInput): PlanAccess {
  const effectivePlan = resolveEffectivePlan(gym);
  const isPaid = effectivePlan === "starter_49" || effectivePlan === "growth_79";
  const isGrowth = effectivePlan === "growth_79";

  const features = Object.fromEntries(
    ALL_FEATURES.map((f) => [f, false])
  ) as Record<PlanFeature, boolean>;

  if (effectivePlan === "starter_49") {
    for (const f of STARTER_FEATURES) features[f] = true;
  }
  if (effectivePlan === "growth_79") {
    for (const f of ALL_FEATURES) features[f] = true;
  }

  return { effectivePlan, features, isPaid, isGrowth };
}

export function hasPlanFeature(
  gym: GymPlanInput,
  feature: PlanFeature
): boolean {
  return buildPlanAccess(gym).features[feature];
}

export function planFeatureErrorMessage(feature: PlanFeature): string {
  if (GROWTH_ONLY_FEATURES.includes(feature)) {
    return "This feature is available on the Growth plan (£79/month per location). Upgrade in Settings.";
  }
  return "An active Starter or Growth subscription is required. Upgrade in Settings.";
}
