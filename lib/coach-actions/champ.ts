/**
 * CHAMP Action Playbook – category config and mapping
 *
 * CHAMP = Connect, Help, Activate, Monitor, Praise.
 * Maps existing coach_actions.action_type to CHAMP categories so we do not introduce new models.
 * Actions are derived from member risk context: commitment score thresholds, habit decay velocity,
 * recent inactivity, missed sessions, and previous coach actions (see generate.ts).
 */

// CHAMP category IDs
export type ChampCategoryId = 'connect' | 'help' | 'activate' | 'monitor' | 'praise';

// Existing DB action_type (from coach_actions table)
export type CoachActionType =
  | 'contact_member'
  | 'send_campaign'
  | 'check_in'
  | 'follow_up'
  | 'investigate_issue';

/** One CHAMP category: color, icon, label, suggested action verbs */
export interface ChampCategoryConfig {
  id: ChampCategoryId;
  label: string;
  verb: string; // Clear verb for buttons
  color: string; // Tailwind border/background
  bgLight: string;
  icon: string; // Lucide icon name
  /** 1–3 suggested action descriptions (templates) */
  suggestedActions: string[];
}

/** Map DB action_type → CHAMP category */
const ACTION_TYPE_TO_CHAMP: Record<CoachActionType, ChampCategoryId> = {
  contact_member: 'connect',
  check_in: 'help',
  send_campaign: 'activate',
  follow_up: 'monitor',
  investigate_issue: 'monitor',
};

/** CHAMP category order and config */
export const CHAMP_CATEGORIES: ChampCategoryConfig[] = [
  {
    id: 'connect',
    label: 'Connect',
    verb: 'Connect',
    color: 'border-blue-500 bg-blue-500',
    bgLight: 'bg-blue-50 border-blue-200',
    icon: 'Phone',
    suggestedActions: [
      'Call at-risk members',
      'Reach out to high-risk members',
      'Personal check in call',
    ],
  },
  {
    id: 'help',
    label: 'Help',
    verb: 'Help',
    color: 'border-emerald-500 bg-emerald-500',
    bgLight: 'bg-emerald-50 border-emerald-200',
    icon: 'Heart',
    suggestedActions: [
      'Schedule a 1-on-1 check-in',
      'Identify barriers to attendance',
      'Offer support or modifications',
    ],
  },
  {
    id: 'activate',
    label: 'Activate',
    verb: 'Activate',
    color: 'border-amber-500 bg-amber-500',
    bgLight: 'bg-amber-50 border-amber-200',
    icon: 'Zap',
    suggestedActions: [
      'Send a motivation challenge',
      'Send reengagement campaign',
      'Invite to a class or event',
    ],
  },
  {
    id: 'monitor',
    label: 'Monitor',
    verb: 'Monitor',
    color: 'border-violet-500 bg-violet-500',
    bgLight: 'bg-violet-50 border-violet-200',
    icon: 'Eye',
    suggestedActions: [
      'Follow up with low engagers',
      'Review visit patterns',
      'Investigate engagement drop',
    ],
  },
  {
    id: 'praise',
    label: 'Praise',
    verb: 'Praise',
    color: 'border-rose-500 bg-rose-500',
    bgLight: 'bg-rose-50 border-rose-200',
    icon: 'Star',
    suggestedActions: [
      'Celebrate a member milestone',
      'Thank a reengaged member',
      'Recognize consistency',
    ],
  },
];

/**
 * Map coach_actions.action_type to CHAMP category.
 * Used to group assigned actions by CHAMP on the playbook.
 */
export function getChampCategoryForActionType(
  actionType: string
): ChampCategoryId {
  return (
    ACTION_TYPE_TO_CHAMP[actionType as CoachActionType] ?? 'monitor'
  );
}

/** Get full config for a CHAMP category */
export function getChampCategoryConfig(
  id: ChampCategoryId
): ChampCategoryConfig {
  const c = CHAMP_CATEGORIES.find((cat) => cat.id === id);
  if (!c) throw new Error(`Unknown CHAMP category: ${id}`);
  return c;
}
