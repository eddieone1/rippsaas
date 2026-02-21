/**
 * CHAMP Framework Configuration
 * 
 * CHAMP = Connect, Help, Activate, Monitor, Praise
 * Framework for organizing coach actions by category.
 */

export type ChampCategoryId = "connect" | "help" | "activate" | "monitor" | "praise";

export interface ChampCategoryConfig {
  id: ChampCategoryId;
  label: string;
  verb: string;
  color: string; // Tailwind class for icon background
  bgLight: string; // Tailwind class for card background
  suggestedActions: string[];
}

export const CHAMP_CATEGORIES: ChampCategoryConfig[] = [
  {
    id: "connect",
    label: "Connect",
    verb: "Reach out and build relationships",
    color: "bg-blue-500",
    bgLight: "bg-blue-50 border-blue-200",
    suggestedActions: [
      "Call member to check in",
      "Send personal message",
      "Invite to group class",
    ],
  },
  {
    id: "help",
    label: "Help",
    verb: "Support members through challenges",
    color: "bg-rose-500",
    bgLight: "bg-rose-50 border-rose-200",
    suggestedActions: [
      "Offer programme modification",
      "Provide resources or guidance",
      "Address barriers to attendance",
    ],
  },
  {
    id: "activate",
    label: "Activate",
    verb: "Re-engage inactive members",
    color: "bg-lime-500",
    bgLight: "bg-lime-50 border-lime-200",
    suggestedActions: [
      "Send re-engagement campaign",
      "Offer comeback incentive",
      "Schedule check-in call",
    ],
  },
  {
    id: "monitor",
    label: "Monitor",
    verb: "Track progress and watch for risks",
    color: "bg-amber-500",
    bgLight: "bg-amber-50 border-amber-200",
    suggestedActions: [
      "Review commitment score trends",
      "Check engagement metrics",
      "Flag for follow-up if needed",
    ],
  },
  {
    id: "praise",
    label: "Praise",
    verb: "Celebrate wins and milestones",
    color: "bg-violet-500",
    bgLight: "bg-violet-50 border-violet-200",
    suggestedActions: [
      "Celebrate re-engagement",
      "Acknowledge consistency",
      "Recognise achievements",
    ],
  },
];

/**
 * Get configuration for a CHAMP category
 */
export function getChampCategoryConfig(
  categoryId: ChampCategoryId
): ChampCategoryConfig {
  const config = CHAMP_CATEGORIES.find((c) => c.id === categoryId);
  if (!config) {
    throw new Error(`Unknown CHAMP category: ${categoryId}`);
  }
  return config;
}

/**
 * Map action type to CHAMP category
 * 
 * Action types are generated from commitment scores, risk flags, etc.
 * This function categorises them into CHAMP buckets.
 */
export function getChampCategoryForActionType(
  actionType: string
): ChampCategoryId {
  const lower = actionType.toLowerCase();

  // Connect: relationship-building actions
  if (
    lower.includes("call") ||
    lower.includes("contact") ||
    lower.includes("reach") ||
    lower.includes("connect") ||
    lower.includes("check-in")
  ) {
    return "connect";
  }

  // Help: support and assistance
  if (
    lower.includes("help") ||
    lower.includes("support") ||
    lower.includes("assist") ||
    lower.includes("guidance") ||
    lower.includes("barrier") ||
    lower.includes("modify")
  ) {
    return "help";
  }

  // Activate: re-engagement actions
  if (
    lower.includes("activate") ||
    lower.includes("re-engage") ||
    lower.includes("reengage") ||
    lower.includes("comeback") ||
    lower.includes("incentive") ||
    lower.includes("campaign")
  ) {
    return "activate";
  }

  // Monitor: tracking and observation
  if (
    lower.includes("monitor") ||
    lower.includes("track") ||
    lower.includes("review") ||
    lower.includes("watch") ||
    lower.includes("observe") ||
    lower.includes("flag")
  ) {
    return "monitor";
  }

  // Default to connect for unknown types
  return "connect";
}
