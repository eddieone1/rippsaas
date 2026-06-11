/** Internal plan identifiers — not all are Stripe subscriptions */
export type PlanId = "free_audit" | "starter_49" | "growth_79";

export const PLANS = {
  free_audit: {
    id: "free_audit" as const,
    name: "Free Retention Audit",
    priceLabel: "£0",
    priceSuffix: "",
    perLocation: false,
    cta: "Get Free Audit",
    ctaHref: "/audit",
    description:
      "Upload your member data and receive a retention report showing which members may be at risk, why they are at risk, and what actions to take.",
    bestFor: "Gyms that want to see their at-risk members before paying.",
    features: [
      "Free member retention audit",
      "At-risk member summary",
      "Churn risk overview",
      "Basic behaviour insights",
      "Recommended retention actions",
      "No card required",
      "No software subscription required",
    ],
    isSubscription: false,
  },
  starter_49: {
    id: "starter_49" as const,
    name: "Starter",
    priceLabel: "£49",
    priceSuffix: "/month per location",
    perLocation: true,
    cta: "Start Starter Plan",
    ctaHref: "/signup?plan=starter_49",
    description:
      "For single-location gyms that want to track at-risk members and run simple retention actions.",
    bestFor: "Independent gyms and studios.",
    memberLimit: "Best for up to 250–300 active members",
    locationLimit: "1 location included",
    features: [
      "Churn risk scoring",
      "At-risk member list",
      "Retention dashboard",
      "CSV member uploads",
      "Email campaign tracking",
      "Weekly retention summary",
      "Standard support",
      "Single-location use",
    ],
    isSubscription: true,
  },
  growth_79: {
    id: "growth_79" as const,
    name: "Growth",
    priceLabel: "£79",
    priceSuffix: "/month per location",
    perLocation: true,
    cta: "Start Growth Plan",
    ctaHref: "/signup?plan=growth_79",
    description:
      "For gyms that need more visibility, segmentation, campaign support, and multi-location retention tracking.",
    bestFor: "Larger gyms and multi-location operators.",
    features: [
      "Everything in Starter",
      "Multi-location dashboard",
      "Advanced member segmentation",
      "SMS campaign support",
      "Priority support",
      "Monthly retention review/report",
      "Extended campaign history",
      "Team/coach task assignment",
    ],
    isSubscription: true,
  },
} as const;

export const PRICING_HERO = {
  title: "Simple pricing built for independent gyms.",
  subtitle:
    "Start with a free retention audit, then choose a monthly plan when you're ready to track and reduce member churn.",
  positioning: "See which members are at risk before paying.",
};

export const PRICING_FOOTNOTE =
  "No long-term contracts. No setup fee for CSV uploads. SMS usage billed separately. Custom integrations may require a setup fee.";

export const AUDIT_SECTION_COPY =
  "Not ready to subscribe yet? Start with a free retention audit. Send us your member data and we'll show you which members may be at risk, why they are at risk, and what actions you can take next.";

/** Stripe price IDs — set in environment; create products in Stripe Dashboard */
export function getStripePriceId(planId: "starter_49" | "growth_79"): string | undefined {
  if (planId === "starter_49") {
    return process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || process.env.STRIPE_STARTER_PRICE_ID;
  }
  if (planId === "growth_79") {
    return process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID || process.env.STRIPE_GROWTH_PRICE_ID;
  }
  return undefined;
}

export function getPlanDisplayName(planId: PlanId | string | null | undefined): string {
  if (planId === "starter_49") return "Starter";
  if (planId === "growth_79") return "Growth";
  if (planId === "free_audit") return "Free Retention Audit";
  return "Unknown plan";
}

export function getPlanPriceLabel(planId: PlanId | string | null | undefined): string {
  if (planId === "starter_49") return "£49/month per location";
  if (planId === "growth_79") return "£79/month per location";
  if (planId === "free_audit") return "Free audit";
  return "";
}
