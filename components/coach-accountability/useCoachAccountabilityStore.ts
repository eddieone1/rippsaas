"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Touch, Member, Coach, Play } from "./types";
import { TOUCH_POINTS, OUTCOME_BONUS_BOOKED } from "./types";
import { DUMMY_PLAYS } from "./dummy-data";

/** Shape returned by GET /api/plays (snake_case from intervention_plays) */
interface PlaysApiRow {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  trigger_type?: string;
  triggerType?: string;
  min_risk_score?: number;
  minRiskScore?: number;
  channels?: string[];
  template_body?: string;
  templateBody?: string;
  template_subject?: string | null;
  templateSubject?: string | null;
}

/** Map a plays API row into the Coach Accountability Play shape */
function mapPlaysApiRow(p: PlaysApiRow): Play {
  const isActive = p.is_active ?? p.isActive ?? true;
  const minRiskScore = p.min_risk_score ?? p.minRiskScore ?? 0;
  const channels = p.channels ?? [];
  const templateBody = p.template_body ?? p.templateBody ?? "";
  const channelLabel =
    channels.length > 0
      ? channels
          .map((c) => {
            if (c === "EMAIL") return "Email";
            if (c === "SMS") return "SMS";
            if (c === "WHATSAPP") return "DM";
            return c;
          })
          .join(" / ")
      : undefined;

  // Derive lifecycle stage from risk score threshold
  let lifecycleStage: string | undefined;
  if (minRiskScore >= 65) lifecycleStage = "At Risk";
  else if (minRiskScore >= 40) lifecycleStage = "Slipping";
  else if (minRiskScore >= 20) lifecycleStage = "Win-back";

  // Derive goal from trigger type & risk
  let goal: string | undefined;
  if (minRiskScore >= 65) goal = "Re-engage";
  else if (minRiskScore >= 40) goal = "Activate";
  else goal = "Retain";

  // Build human-readable steps from template + channels
  const steps: string[] = [];
  if (channels.length > 0) {
    steps.push(`Send via ${channelLabel}`);
  }
  steps.push("Log response");
  steps.push("Follow up if needed");

  return {
    id: p.id,
    name: p.name,
    whenToUse: p.description ?? `Risk score ≥ ${minRiskScore}`,
    timeToRun: `~${Math.max(3, channels.length * 3)} min`,
    steps,
    lifecycleStage,
    goal,
    channel: channelLabel,
  };
}

const DUPLICATE_TOUCH_WINDOW_MS = 2 * 60 * 60 * 1000;

function getTouchPoints(t: Touch, memberSaved?: boolean): number {
  let pts = TOUCH_POINTS[t.channel];
  if (t.type === "system") pts = Math.max(1, Math.floor(pts * 0.5));
  if (t.outcome === "booked" && memberSaved) pts += OUTCOME_BONUS_BOOKED;
  return pts;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function useCoachAccountabilityStore() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [members, setMembers] = useState<Member[]>([]);
  const [touches, setTouches] = useState<Touch[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [plays, setPlays] = useState<Play[]>(DUMMY_PLAYS);
  const [apiCoachMetrics, setApiCoachMetrics] = useState<
    Array<{
      coachId: string;
      membersAssignedCount: number;
      atRiskAssignedCount: number;
      contactedTodayCount: number;
      contactedThisWeekCount: number;
      contactCoveragePct: number;
      avgResponseTimeHours: number;
      responseRatePct: number;
      reengagementRatePct: number;
      saveRatePct: number;
      behaviourImprovementRatePct: number;
      membersSavedThisMonth: number;
      revenueRetainedThisMonthGBP: number;
      coachRetentionScore: number;
      outreachStreakDays?: number;
    }>
  >([]);
  const [apiTeamMetrics, setApiTeamMetrics] = useState<{
    revenueAtRiskGBP: number;
    membersAtRiskCount: number;
    membersSavedThisMonth: number;
    revenueRetainedThisMonthGBP: number;
    retentionRatePct: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [touchModalMemberId, setTouchModalMemberId] = useState<string | null>(
    null
  );
  const [dateRange, setDateRange] = useState<"today" | "week">("week");
  const [locationId, setLocationId] = useState<string>("all");
  const [inboxTab, setInboxTab] = useState<
    "at_risk" | "slipping" | "win_back" | "overdue"
  >("at_risk");
  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "coach" | "automated"
  >("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch real data from API on mount
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch core data and plays in parallel
      const [mainRes, playsRes] = await Promise.all([
        fetch("/api/coach-accountability"),
        fetch("/api/plays").catch(() => null),
      ]);

      if (!mainRes.ok) {
        const errBody = await mainRes.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${mainRes.status}`);
      }

      const json = await mainRes.json();
      const data = json.data as {
        members: Member[];
        coaches: Coach[];
        touches: Touch[];
        coachMetrics?: Array<{
          coachId: string;
          membersAssignedCount: number;
          atRiskAssignedCount: number;
          contactedTodayCount: number;
          contactedThisWeekCount: number;
          contactCoveragePct: number;
          avgResponseTimeHours: number;
          responseRatePct: number;
          reengagementRatePct: number;
          saveRatePct: number;
          behaviourImprovementRatePct: number;
          membersSavedThisMonth: number;
          revenueRetainedThisMonthGBP: number;
          coachRetentionScore: number;
          outreachStreakDays?: number;
        }>;
        teamMetrics?: {
          revenueAtRiskGBP: number;
          membersAtRiskCount: number;
          membersSavedThisMonth: number;
          revenueRetainedThisMonthGBP: number;
          retentionRatePct: number;
        };
      };
      setMembers(data.members);
      setCoaches(data.coaches);
      setTouches(data.touches);

      // Store API coach/team metrics for use by Mission Control
      if (data.coachMetrics) setApiCoachMetrics(data.coachMetrics);
      if (data.teamMetrics) setApiTeamMetrics(data.teamMetrics);

      // Map plays from API if the fetch succeeded, otherwise keep static fallback
      if (playsRes?.ok) {
        const playsJson: PlaysApiRow[] = await playsRes.json();
        const activePlays = playsJson.filter(
          (p) => (p.is_active ?? p.isActive) !== false
        );
        if (activePlays.length > 0) {
          setPlays(activePlays.map(mapPlaysApiRow));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      console.error("Coach accountability fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Derived / computed values (unchanged logic)
  // ---------------------------------------------------------------------------
  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const touchesByMember = useMemo(() => {
    const map: Record<string, Touch[]> = {};
    touches.forEach((t) => {
      if (!map[t.memberId]) map[t.memberId] = [];
      map[t.memberId].push(t);
    });
    Object.keys(map).forEach((id) =>
      map[id].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
    return map;
  }, [touches]);

  const memberTouches = useMemo(() => {
    if (!selectedMemberId) return [];
    let list = touchesByMember[selectedMemberId] ?? [];
    if (timelineFilter === "coach")
      list = list.filter((t) => t.type === "coach");
    if (timelineFilter === "automated")
      list = list.filter((t) => t.type === "system");
    return list;
  }, [selectedMemberId, touchesByMember, timelineFilter]);

  const touchSummaryForSelected = useMemo(() => {
    if (!selectedMemberId) return undefined;
    const list = touchesByMember[selectedMemberId] ?? [];
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const touchesLast14Days = list.filter(
      (t) => now - new Date(t.createdAt).getTime() <= fourteenDaysMs
    ).length;
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const last = sorted[0];
    const daysSinceLastTouch = last
      ? Math.floor(
          (now - new Date(last.createdAt).getTime()) / (24 * 60 * 60 * 1000)
        )
      : null;
    return { touchesLast14Days, daysSinceLastTouch };
  }, [selectedMemberId, touchesByMember]);

  const inboxMembers = useMemo(() => {
    const now = Date.now();
    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    let list = members;
    if (inboxTab === "at_risk")
      list = list.filter((m) => m.status === "at_risk");
    if (inboxTab === "slipping")
      list = list.filter((m) => m.status === "slipping");
    if (inboxTab === "win_back")
      list = list.filter((m) => m.status === "win_back");
    if (inboxTab === "overdue") {
      list = list.filter((m) => {
        if (!m.lastTouchAt) return true;
        return now - new Date(m.lastTouchAt).getTime() > tenDaysMs;
      });
    }
    return list.sort((a, b) => (a.healthScore ?? 100) - (b.healthScore ?? 100));
  }, [members, inboxTab]);

  const coachMetrics = useMemo(() => {
    const weekStart = startOfWeek(new Date()).getTime();
    const byCoach: Record<
      string,
      {
        coach: Coach;
        touchesThisWeek: number;
        touchPointsThisWeek: number;
        savesThisWeek: number;
        savedRevenueMRR: number;
        membersOwned: number;
      }
    > = {};
    coaches.forEach((c) => {
      byCoach[c.id] = {
        coach: c,
        touchesThisWeek: 0,
        touchPointsThisWeek: 0,
        savesThisWeek: 0,
        savedRevenueMRR: 0,
        membersOwned: 0,
      };
    });
    members.forEach((m) => {
      if (m.ownerCoachId && byCoach[m.ownerCoachId]) {
        byCoach[m.ownerCoachId].membersOwned++;
        if (m.saved) {
          byCoach[m.ownerCoachId].savesThisWeek += 1;
          byCoach[m.ownerCoachId].savedRevenueMRR += m.mrr;
        }
      }
    });
    touches.forEach((t) => {
      const ts = new Date(t.createdAt).getTime();
      if (ts < weekStart) return;
      const c = byCoach[t.coachId];
      if (!c) return;
      c.touchesThisWeek += 1;
      const mem = members.find((m) => m.id === t.memberId);
      c.touchPointsThisWeek += getTouchPoints(t, mem?.saved);
    });
    return Object.values(byCoach).sort(
      (a, b) => b.touchPointsThisWeek - a.touchPointsThisWeek
    );
  }, [coaches, touches, members]);

  /** Team metrics for Mission Control (prefer API when available) */
  const teamMetrics = useMemo(() => {
    if (apiTeamMetrics) return apiTeamMetrics;
    const atRisk = members.filter((m) => m.status === "at_risk" || m.status === "slipping");
    const saved = members.filter((m) => m.saved);
    const active = members.filter((m) => ["stable", "slipping", "at_risk"].includes(m.status));
    return {
      revenueAtRiskGBP: atRisk.reduce((s, m) => s + m.mrr, 0),
      membersAtRiskCount: atRisk.length,
      membersSavedThisMonth: saved.length,
      revenueRetainedThisMonthGBP: saved.reduce((s, m) => s + m.mrr, 0),
      retentionRatePct: members.length ? Math.round((active.length / members.length) * 100) : 100,
    };
  }, [apiTeamMetrics, members]);

  /** Coach metrics for Mission Control (prefer API when available, else computed) */
  const coachMetricsForMissionControl = useMemo(() => {
    if (apiCoachMetrics.length > 0) return apiCoachMetrics;
    return coachMetrics.map((c) => ({
      coachId: c.coach.id,
      membersAssignedCount: c.membersOwned,
      atRiskAssignedCount: members.filter(
        (m) => m.ownerCoachId === c.coach.id && (m.status === "at_risk" || m.status === "slipping")
      ).length,
      contactedTodayCount: 0,
      contactedThisWeekCount: c.touchesThisWeek,
      contactCoveragePct: 0,
      avgResponseTimeHours: 24,
      responseRatePct: 50,
      reengagementRatePct: c.savesThisWeek > 0 ? 20 : 0,
      saveRatePct: c.savesThisWeek > 0 ? 15 : 0,
      behaviourImprovementRatePct: 10,
      membersSavedThisMonth: c.savesThisWeek,
      revenueRetainedThisMonthGBP: c.savedRevenueMRR,
      coachRetentionScore: 70,
      outreachStreakDays: c.touchesThisWeek > 0 ? 7 : 0,
    }));
  }, [apiCoachMetrics, coachMetrics, members]);

  const overdueCounts = useMemo(() => {
    const now = Date.now();
    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    let noCoach = 0;
    let overdueTouch = 0;
    members.forEach((m) => {
      if (!m.ownerCoachId || m.ownerCoachId === "") noCoach++;
      else if (m.lastTouchAt) {
        if (now - new Date(m.lastTouchAt).getTime() > tenDaysMs)
          overdueTouch++;
      } else overdueTouch++;
    });
    return { noCoach, overdueTouch };
  }, [members]);

  // ---------------------------------------------------------------------------
  // Mutations (write to API, then optimistically update local state)
  // ---------------------------------------------------------------------------
  const addTouch = useCallback(
    async (touch: Omit<Touch, "id" | "createdAt">) => {
      // Local duplicate check (optimistic)
      const nowMs = Date.now();
      const duplicate = touches.find(
        (t) =>
          t.memberId === touch.memberId &&
          t.channel === touch.channel &&
          t.outcome === touch.outcome &&
          nowMs - new Date(t.createdAt).getTime() < DUPLICATE_TOUCH_WINDOW_MS
      );
      if (duplicate) {
        showToast(
          "Duplicate touch blocked (same member/channel/outcome within 2 hours)"
        );
        return false;
      }

      try {
        const res = await fetch("/api/coach-accountability/touches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: touch.memberId,
            coachId: touch.coachId,
            channel: touch.channel,
            type: touch.type,
            outcome: touch.outcome,
            notes: touch.notes,
            playId: touch.playId,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          showToast(errBody.error ?? "Failed to log touch");
          return false;
        }

        const json = await res.json();
        const newTouch: Touch = json.data;

        setTouches((prev) => [newTouch, ...prev]);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === touch.memberId
              ? { ...m, lastTouchAt: newTouch.createdAt }
              : m
          )
        );
        showToast("Touch logged");
        setTouchModalMemberId(null);
        return true;
      } catch {
        showToast("Network error logging touch");
        return false;
      }
    },
    [touches, showToast]
  );

  const openLogTouchModal = useCallback((memberId: string) => {
    setTouchModalMemberId(memberId);
  }, []);
  const closeLogTouchModal = useCallback(() => {
    setTouchModalMemberId(null);
  }, []);

  const launchPlay = useCallback(
    async (playId: string, memberId: string, coachId: string) => {
      try {
        const res = await fetch("/api/coach-accountability/touches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId,
            coachId,
            channel: "play_launch",
            type: "system",
            outcome: "follow_up",
            playId,
          }),
        });

        if (!res.ok) {
          showToast("Failed to launch play");
          return;
        }

        const json = await res.json();
        const newTouch: Touch = json.data;

        setTouches((prev) => [newTouch, ...prev]);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? { ...m, lastTouchAt: newTouch.createdAt }
              : m
          )
        );
        showToast("Play launched");
      } catch {
        showToast("Network error launching play");
      }
    },
    [showToast]
  );

  const assignMemberToCoach = useCallback(
    async (memberId: string, coachId: string) => {
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, ownerCoachId: coachId } : m
        )
      );

      try {
        const res = await fetch("/api/coach-accountability/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, coachId }),
        });

        if (!res.ok) {
          // Revert on failure
          fetchData();
          showToast("Failed to assign coach");
          return;
        }

        showToast("Member assigned");
      } catch {
        fetchData();
        showToast("Network error assigning coach");
      }
    },
    [showToast, fetchData]
  );

  const markMemberSaved = useCallback(
    async (memberId: string, saved: boolean) => {
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, saved } : m))
      );

      try {
        const res = await fetch("/api/coach-accountability/mark-saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, saved }),
        });

        if (!res.ok) {
          // Revert on failure
          setMembers((prev) =>
            prev.map((m) =>
              m.id === memberId ? { ...m, saved: !saved } : m
            )
          );
          showToast("Failed to update saved status");
        }
      } catch {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId ? { ...m, saved: !saved } : m
          )
        );
        showToast("Network error updating saved status");
      }
    },
    [showToast]
  );

  const autoAssignUnowned = useCallback(async () => {
    const unowned = members.filter(
      (m) => !m.ownerCoachId || m.ownerCoachId === ""
    );
    if (unowned.length === 0) {
      showToast("No unassigned members");
      return;
    }
    if (coaches.length === 0) {
      showToast("No coaches available");
      return;
    }

    // Load-balance: assign to coaches with fewest members
    const loads = coaches.map((c) => ({
      id: c.id,
      count: members.filter((m) => m.ownerCoachId === c.id).length,
    }));
    loads.sort((a, b) => a.count - b.count);

    const assignments: { memberId: string; coachId: string }[] = [];
    for (const m of unowned) {
      // Always assign to coach with current lowest load
      loads.sort((a, b) => a.count - b.count);
      const target = loads[0];
      assignments.push({ memberId: m.id, coachId: target.id });
      target.count++;
    }

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => {
        const a = assignments.find((x) => x.memberId === m.id);
        if (a) return { ...m, ownerCoachId: a.coachId };
        return m;
      })
    );

    try {
      const res = await fetch("/api/coach-accountability/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });

      if (!res.ok) {
        fetchData();
        showToast("Failed to auto-assign");
        return;
      }

      showToast(`Auto-assigned ${assignments.length} members`);
    } catch {
      fetchData();
      showToast("Network error during auto-assign");
    }
  }, [members, coaches, showToast, fetchData]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    members,
    touches,
    coaches,
    plays,
    loading,
    error,
    fetchData,
    selectedMemberId,
    setSelectedMemberId,
    selectedMember,
    touchModalMemberId,
    openLogTouchModal,
    closeLogTouchModal,
    addTouch,
    launchPlay,
    assignMemberToCoach,
    markMemberSaved,
    dateRange,
    setDateRange,
    locationId,
    setLocationId,
    inboxTab,
    setInboxTab,
    inboxMembers,
    memberTouches,
    touchSummaryForSelected,
    timelineFilter,
    setTimelineFilter,
    coachMetrics,
    coachMetricsForMissionControl,
    teamMetrics,
    overdueCounts,
    autoAssignUnowned,
    toast,
    showToast,
  };
}
