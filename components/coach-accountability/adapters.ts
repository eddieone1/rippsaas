/**
 * Adapters between API types (types.ts) and Mission Control types (mission-control-types.ts)
 */

import type { Member as ApiMember, Touch } from "./types";
import type {
  Member as McMember,
  Coach as McCoach,
  Interaction,
  RetentionPlay,
} from "./mission-control-types";
import type { Coach as ApiCoach, Play as ApiPlay } from "./types";

/** Map API Member to Mission Control Member */
export function apiMemberToMissionControl(m: ApiMember): McMember {
  const riskLevel =
    m.status === "at_risk" ? "high" : m.status === "slipping" ? "moderate" : "low";
  const lifecycleStage =
    m.status === "at_risk"
      ? "at_risk_silent_quit"
      : m.status === "slipping"
        ? "plateau_boredom_risk"
        : m.status === "win_back"
          ? "win_back_window"
          : "momentum_identity";

  return {
    id: m.id,
    name: m.name,
    avatarUrl: null,
    phone: null,
    email: null,
    membershipType: m.plan,
    joinDate: "",
    coachOwnerId: m.ownerCoachId,
    riskLevel,
    churnProbability: Math.max(0, 100 - m.healthScore),
    commitmentScore: m.healthScore,
    habitDecayVelocity: m.habitDecay === 3 ? 1.5 : m.habitDecay === 2 ? 1 : 0.5,
    lifecycleStage,
    riskReasons: m.reasons,
    lastVisitDate: m.lastVisitDate ?? null,
    lastInteractionDate: m.lastTouchAt ?? null,
    attendanceSeries: [],
    commitmentSeries: [],
    socialSeries: [],
    touchSeries: [],
    tags: [],
    saved: m.saved,
  };
}

/** Map API Touch to Mission Control Interaction */
export function apiTouchToInteraction(t: Touch): Interaction {
  const type =
    t.channel === "dm" ? "whatsapp" : t.channel === "play_launch" || t.channel === "auto_sms" ? "sms" : t.channel;
  const outcome = touchOutcomeToInteractionOutcome(t.outcome);
  return {
    id: t.id,
    memberId: t.memberId,
    coachId: t.coachId,
    timestamp: t.createdAt,
    type: type as Interaction["type"],
    playId: t.playId ?? null,
    notes: t.notes ?? null,
    outcome,
    followUpDate: null,
  };
}

function touchOutcomeToInteractionOutcome(
  o: Touch["outcome"]
): Interaction["outcome"] {
  switch (o) {
    case "booked":
      return "rebooked";
    case "replied":
      return "rebooked";
    case "no_response":
      return "no_response";
    case "follow_up":
      return "still_at_risk";
    case "declined":
      return "cancelled";
    default:
      return "no_response";
  }
}

/** Map interaction outcome (modal) to API touch outcome */
export function interactionOutcomeToTouchOutcome(
  o: NonNullable<Interaction["outcome"]>
): Touch["outcome"] {
  switch (o) {
    case "rebooked":
    case "attended_next":
      return "booked";
    case "no_response":
      return "no_response";
    case "still_at_risk":
      return "follow_up";
    case "freeze_requested":
      return "replied";
    case "cancelled":
      return "declined";
    default:
      return "follow_up";
  }
}

/** Map interaction type (modal) to API touch channel */
export function interactionTypeToTouchChannel(
  t: Interaction["type"]
): Touch["channel"] {
  switch (t) {
    case "whatsapp":
      return "dm";
    case "call":
    case "sms":
    case "email":
    case "in_person":
      return t;
    default:
      return "sms";
  }
}

/** Map API Coach to Mission Control Coach */
export function apiCoachToMissionControl(c: ApiCoach): McCoach {
  return {
    id: c.id,
    name: c.name,
    avatarUrl: null,
    role: "coach",
  };
}

/** Map API Play (from store) to Mission Control RetentionPlay */
export function apiPlayToRetentionPlay(p: ApiPlay): RetentionPlay {
  const ch = (p.channel ?? "SMS").toLowerCase();
  const suggestedChannel: RetentionPlay["suggestedChannel"] =
    ch.includes("sms") ? "sms"
    : ch.includes("email") ? "email"
    : ch.includes("whatsapp") || ch.includes("dm") ? "whatsapp"
    : "sms";

  return {
    id: p.id,
    name: p.name,
    category: "re_engage",
    stageTargets: ["at_risk_silent_quit", "plateau_boredom_risk"],
    triggerReasons: p.whenToUse ? [p.whenToUse] : [],
    suggestedChannel,
    templateMessage: p.steps?.[0] ?? `Hi – check in from your coach (${p.name}).`,
    expectedOutcome: p.goal ?? "Re-engage",
  };
}
