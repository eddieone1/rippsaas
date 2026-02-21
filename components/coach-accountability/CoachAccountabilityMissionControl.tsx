"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import MissionControlKpiBar from "./MissionControlKpiBar";
import MissionControlInbox from "./MissionControlInbox";
import MissionControlTodayView, {
  type PlaybookChampData,
} from "./MissionControlTodayView";
import MissionControlMemberPanel from "./MissionControlMemberPanel";
import MissionControlRightPanel from "./MissionControlRightPanel";
import MissionControlManagerView from "./MissionControlManagerView";
import AutomationRulesDrawer from "./AutomationRulesDrawer";
import RunPlayModal from "./RunPlayModal";
import LogInteractionModal from "./LogInteractionModal";
import { useCoachAccountabilityStore } from "./useCoachAccountabilityStore";
import {
  apiMemberToMissionControl,
  apiTouchToInteraction,
  apiPlayToRetentionPlay,
  interactionOutcomeToTouchOutcome,
  interactionTypeToTouchChannel,
} from "./adapters";
import type {
  Member,
  Coach,
  RetentionPlay,
  Task,
  AutomationRule,
} from "./mission-control-types";
import type { InteractionType, InteractionOutcome } from "./mission-control-types";
import { MOCK_AUTOMATION_RULES } from "./mission-control-mock-data";

const canViewManager = (role: string) =>
  role === "owner" || role === "manager" || role === "admin";

interface CoachAccountabilityMissionControlProps {
  currentCoachId: string;
  userRole: string;
  initialLeftView?: "inbox" | "today";
}

export default function CoachAccountabilityMissionControl({
  currentCoachId,
  userRole,
  initialLeftView = "inbox",
}: CoachAccountabilityMissionControlProps) {
  const store = useCoachAccountabilityStore();
  const {
    members: apiMembers,
    touches,
    coaches: apiCoaches,
    plays: apiPlays,
    loading,
    error,
    fetchData,
    selectedMemberId,
    setSelectedMemberId,
    addTouch,
    assignMemberToCoach,
    markMemberSaved,
    coachMetricsForMissionControl,
    teamMetrics,
    showToast,
    toast,
  } = store;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(
    () => [...MOCK_AUTOMATION_RULES]
  );
  const [viewMode, setViewMode] = useState<"coach" | "manager">("coach");
  const [managerPanelOpen, setManagerPanelOpen] = useState(false);
  const [automationDrawerOpen, setAutomationDrawerOpen] = useState(false);
  const [runPlayModal, setRunPlayModal] = useState<{
    play: RetentionPlay;
    member: Member;
  } | null>(null);
  const [logModal, setLogModal] = useState<{
    member: Member;
    action: "message" | "call" | "schedule" | "note";
  } | null>(null);
  const [mobileTab, setMobileTab] = useState<
    "inbox" | "member" | "performance" | "tasks"
  >("inbox");
  const [leftView, setLeftView] = useState<"inbox" | "today">(initialLeftView);
  const [playbookData, setPlaybookData] = useState<PlaybookChampData | null>(
    null
  );

  // Adapt API data to Mission Control types
  const members = useMemo(
    () => apiMembers.map(apiMemberToMissionControl),
    [apiMembers]
  );
  const coaches = useMemo(
    () => apiCoaches.map((c) => ({ id: c.id, name: c.name, avatarUrl: null, role: "coach" as const })),
    [apiCoaches]
  );
  const plays = useMemo(
    () => apiPlays.map(apiPlayToRetentionPlay),
    [apiPlays]
  );

  // Fetch CHAMP playbook data (for Today view)
  const fetchPlaybook = useCallback(async () => {
    try {
      const res = await fetch("/api/coach/playbook");
      if (!res.ok) return;
      const json = await res.json();
      setPlaybookData({
        assignedToday: json.assignedToday ?? [],
        urgent: json.urgent ?? [],
        champGroups: json.champGroups ?? [],
        praiseSuggestions: json.praiseSuggestions ?? [],
      });
    } catch {
      // Silently fail - playbook is optional
    }
  }, []);

  useEffect(() => {
    if (leftView === "today") fetchPlaybook();
  }, [leftView, fetchPlaybook]);

  const handleCompleteChampAction = useCallback(
    async (actionId: string) => {
      try {
        const res = await fetch(`/api/coach/actions/${actionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          showToast("Action completed");
          fetchPlaybook();
        }
      } catch {
        showToast("Failed to complete action");
      }
    },
    [showToast, fetchPlaybook]
  );

  // Role-based filtering: coach view shows only assigned members
  const isManager = canViewManager(userRole);
  const inboxMembers = useMemo(() => {
    if (isManager) return members;
    return members.filter((m) => m.coachOwnerId === currentCoachId || !m.coachOwnerId);
  }, [members, currentCoachId, isManager]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const memberInteractions = useMemo(() => {
    if (!selectedMemberId) return [];
    return touches
      .filter((t) => t.memberId === selectedMemberId)
      .map(apiTouchToInteraction)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [touches, selectedMemberId]);

  const interventionTimestamps = useMemo(
    () => memberInteractions.map((i) => i.timestamp),
    [memberInteractions]
  );

  const savedMembers = useMemo(
    () =>
      members
        .filter((m) => m.saved)
        .map((m) => ({
          member: m,
          coachName: coaches.find((c) => c.id === m.coachOwnerId)?.name ?? "Unknown",
          playName: "Touch",
        }))
        .slice(0, 5),
    [members, coaches]
  );

  const topSavesByPlay = useMemo(() => {
    const byPlay: Record<string, number> = {};
    touches.forEach((t) => {
      if (t.outcome === "booked" && t.playId) {
        byPlay[t.playId] = (byPlay[t.playId] ?? 0) + 1;
      }
    });
    return Object.entries(byPlay)
      .map(([playId, count]) => ({
        playName: plays.find((p) => p.id === playId)?.name ?? "Touch",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [touches, plays]);

  const handleRunPlay = useCallback(
    (play: RetentionPlay) => {
      if (selectedMember) setRunPlayModal({ play, member: selectedMember });
    },
    [selectedMember]
  );

  const handlePlaySend = useCallback(
    async (payload: {
      memberId: string;
      coachId: string;
      channel: InteractionType;
      message: string;
      outcome?: InteractionOutcome;
      followUpDate?: string;
      playId: string;
    }) => {
      const channel = interactionTypeToTouchChannel(payload.channel);
      const outcome = payload.outcome
        ? interactionOutcomeToTouchOutcome(payload.outcome)
        : "follow_up";
      const ok = await addTouch({
        memberId: payload.memberId,
        coachId: payload.coachId,
        channel,
        type: "coach",
        outcome,
        notes: payload.message,
        playId: payload.playId,
      });
      if (ok) {
        showToast("Message sent & interaction logged");
        setRunPlayModal(null);
      }
    },
    [addTouch, showToast]
  );

  const handleQuickAction = useCallback(
    (action: "message" | "call" | "schedule" | "note") => {
      if (selectedMember)
        setLogModal({ member: selectedMember, action });
    },
    [selectedMember]
  );

  const handleLogInteraction = useCallback(
    async (payload: {
      memberId: string;
      coachId: string;
      type: InteractionType;
      notes: string;
      outcome?: InteractionOutcome;
      followUpDate?: string;
    }) => {
      const channel = interactionTypeToTouchChannel(payload.type);
      const outcome = payload.outcome
        ? interactionOutcomeToTouchOutcome(payload.outcome)
        : "no_response";
      const ok = await addTouch({
        memberId: payload.memberId,
        coachId: payload.coachId,
        channel,
        type: "coach",
        outcome,
        notes: payload.notes,
      });
      if (ok) {
        showToast("Interaction logged");
        setLogModal(null);
      }
    },
    [addTouch, showToast]
  );

  const handleReassign = useCallback(
    async (coachId: string) => {
      if (!selectedMemberId) return;
      await assignMemberToCoach(selectedMemberId, coachId);
    },
    [selectedMemberId, assignMemberToCoach]
  );

  const handleManagerReassign = useCallback(
    async (memberId: string, coachId: string) => {
      if (!coachId) return;
      await assignMemberToCoach(memberId, coachId);
    },
    [assignMemberToCoach]
  );

  const handleMarkResolved = useCallback(
    async (resolved: boolean) => {
      if (!selectedMemberId) return;
      await markMemberSaved(selectedMemberId, resolved);
      showToast(resolved ? "Marked resolved" : "Marked still at risk");
    },
    [selectedMemberId, markMemberSaved, showToast]
  );

  const handleCompleteTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: "done" as const } : t
      )
    );
    showToast("Task completed");
  }, [showToast]);

  const handleEditMember = useCallback((memberId: string) => {
    window.open(`/members/${memberId}`, "_blank");
  }, []);

  const handlePinMember = useCallback(() => {
    showToast("Pinned member");
  }, [showToast]);

  const handleSetReminder = useCallback(() => {
    const newTask: Task = {
      id: `t-${Date.now()}`,
      coachId: currentCoachId,
      memberId: selectedMemberId ?? members[0]?.id ?? "",
      title: "Follow up",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "todo",
      priority: 2,
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast("Reminder created");
  }, [selectedMemberId, members, showToast, currentCoachId]);

  const handleToggleRule = useCallback(
    (ruleId: string, enabled: boolean) => {
      setAutomationRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
      );
      showToast(enabled ? "Rule enabled" : "Rule disabled");
    },
    [showToast]
  );

  const mobileTabs = [
    { id: "inbox" as const, label: "Inbox" },
    { id: "member" as const, label: "Member" },
    { id: "performance" as const, label: "Performance" },
    { id: "tasks" as const, label: "Tasks" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading coach accountability...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => fetchData()}
            className="mt-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white hover:bg-lime-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coach Accountability</h1>
            <p className="text-sm text-gray-700">
              Mission-control: behaviour signals → coach actions → outcomes → retention impact
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setLeftView("inbox")}
                className={`px-3 py-2 text-sm font-medium ${
                  leftView === "inbox"
                    ? "bg-lime-500 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                Inbox
              </button>
              <button
                type="button"
                onClick={() => setLeftView("today")}
                className={`px-3 py-2 text-sm font-medium ${
                  leftView === "today"
                    ? "bg-lime-500 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAutomationDrawerOpen(true)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Automation rules
            </button>
            {isManager && (
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode("coach")}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === "coach"
                      ? "bg-lime-500 text-white"
                      : "bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Coach View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("manager");
                    setManagerPanelOpen(true);
                  }}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === "manager"
                      ? "bg-lime-500 text-white"
                      : "bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Manager View
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] space-y-4 p-4">
        <MissionControlKpiBar
          metrics={teamMetrics}
          trend={{ revenueAtRisk: 0, membersAtRisk: 0, membersSaved: 0, retentionRate: 0 }}
        />

        <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {mobileTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMobileTab(t.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
                mobileTab === t.id
                  ? "bg-lime-500 text-white"
                  : "border border-gray-200 bg-white text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div
            className={`lg:col-span-3 ${mobileTab !== "inbox" ? "hidden lg:block" : ""}`}
          >
            <div className="h-[500px] lg:h-[calc(100vh-280px)]">
              {leftView === "inbox" ? (
                <MissionControlInbox
                  members={inboxMembers}
                  coaches={coaches}
                  selectedId={selectedMemberId}
                  currentCoachId={currentCoachId}
                  onSelect={setSelectedMemberId}
                />
              ) : (
                <MissionControlTodayView
                  playbookData={playbookData}
                  onSelectMember={setSelectedMemberId}
                />
              )}
            </div>
          </div>

          <div
            className={`lg:col-span-6 ${mobileTab !== "member" ? "hidden lg:block" : ""}`}
          >
            <div className="space-y-4 overflow-y-auto lg:max-h-[calc(100vh-280px)]">
              <MissionControlMemberPanel
                member={selectedMember}
                coaches={coaches}
                interactions={memberInteractions}
                plays={plays}
                currentCoachId={currentCoachId}
                interventionTimestamps={interventionTimestamps}
                onReassign={handleReassign}
                onRunPlay={handleRunPlay}
                onQuickAction={handleQuickAction}
                onMarkResolved={handleMarkResolved}
                onAddInteraction={() =>
                  selectedMember && handleQuickAction("message")
                }
                onEdit={handleEditMember}
                onPin={handlePinMember}
              />
            </div>
          </div>

          <div
            className={`lg:col-span-3 ${
              mobileTab !== "performance" && mobileTab !== "tasks"
                ? "hidden lg:block"
                : ""
            }`}
          >
            <div className="space-y-4 overflow-y-auto lg:max-h-[calc(100vh-280px)]">
              <MissionControlRightPanel
                coachMetrics={coachMetricsForMissionControl}
                teamMetrics={teamMetrics}
                currentCoachId={currentCoachId}
                coaches={coaches}
                members={members}
                tasks={tasks}
                savedMembers={savedMembers}
                topSavesByPlay={topSavesByPlay}
                onCompleteTask={handleCompleteTask}
                onSetReminder={handleSetReminder}
                playbookAssignedToday={playbookData?.assignedToday}
                playbookUrgent={playbookData?.urgent}
                onCompleteChampAction={handleCompleteChampAction}
                praiseSuggestions={playbookData?.praiseSuggestions ?? []}
              />
            </div>
          </div>
        </div>
      </div>

      {isManager && (
        <MissionControlManagerView
          members={members}
          coaches={coaches}
          coachMetrics={coachMetricsForMissionControl.map((m) => ({
            coachId: m.coachId,
            contactedThisWeekCount: m.contactedThisWeekCount,
            atRiskAssignedCount: m.atRiskAssignedCount,
          }))}
          isOpen={managerPanelOpen && viewMode === "manager"}
          onClose={() => setManagerPanelOpen(false)}
          onReassign={handleManagerReassign}
        />
      )}

      <AutomationRulesDrawer
        rules={automationRules}
        isOpen={automationDrawerOpen}
        onClose={() => setAutomationDrawerOpen(false)}
        onToggleRule={handleToggleRule}
        affectedMemberNote={
          selectedMember ? "Auto-task created for " + selectedMember.name : null
        }
      />

      {runPlayModal && (
        <RunPlayModal
          play={runPlayModal.play}
          member={runPlayModal.member}
          coaches={coaches}
          currentCoachId={currentCoachId}
          onClose={() => setRunPlayModal(null)}
          onSend={handlePlaySend}
        />
      )}
      {logModal && (
        <LogInteractionModal
          member={logModal.member}
          currentCoachId={currentCoachId}
          actionType={logModal.action}
          onClose={() => setLogModal(null)}
          onSubmit={handleLogInteraction}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
