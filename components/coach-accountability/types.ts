/** Coach Accountability / Playbook + Touches */

export type TouchChannel =
  | "call"
  | "sms"
  | "email"
  | "in_person"
  | "dm"
  | "play_launch"
  | "auto_sms";

export type TouchType = "coach" | "system";

export type TouchOutcome =
  | "replied"
  | "booked"
  | "no_response"
  | "follow_up"
  | "declined";

export interface Touch {
  id: string;
  memberId: string;
  coachId: string;
  createdAt: string; // ISO
  channel: TouchChannel;
  type: TouchType;
  outcome: TouchOutcome;
  notes?: string;
  playId?: string;
}

export type MemberStatus = "at_risk" | "slipping" | "win_back" | "stable";

export type ReasonChip =
  | "Attendance drop"
  | "No bookings"
  | "Plateau"
  | "Payment friction";

/** Habit decay velocity: 1–3 arrows */
export type HabitDecayLevel = 1 | 2 | 3;

export interface Member {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  status: MemberStatus;
  healthScore: number; // 0–100
  habitDecay: HabitDecayLevel;
  reasons: ReasonChip[];
  ownerCoachId: string;
  lastTouchAt: string | null; // ISO
  nextSessionAt: string | null; // ISO
  saved?: boolean; // outcome=booked within 7 days → used for +5 points
  lastVisitDate?: string | null; // ISO
}

export interface Coach {
  id: string;
  name: string;
}

export interface Play {
  id: string;
  name: string;
  whenToUse: string;
  timeToRun: string;
  steps: string[];
  lifecycleStage?: string;
  goal?: string;
  channel?: string;
}

/** Touch points for accountability scoring */
export const TOUCH_POINTS: Record<TouchChannel, number> = {
  auto_sms: 1,
  play_launch: 1,
  sms: 2,
  email: 2,
  dm: 2,
  call: 3,
  in_person: 3,
};

export const OUTCOME_BONUS_BOOKED = 5;

/**
 * Phase-2: Passive / inferred touch detection.
 * TODO: Implement backend or client logic to infer touches from signals
 * (e.g. class booked, payment retry, app open) and merge into timeline with type "inferred".
 */
export interface InferredTouchSource {
  id: string;
  memberId: string;
  signalType: string;
  occurredAt: string; // ISO
  confidence: number; // 0–1
}
