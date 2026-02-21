"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CommitmentScoreGauge from "@/components/members/CommitmentScoreGauge";
import type { Member, Coach, Interaction, RetentionPlay } from "./mission-control-types";
import type { LifecycleStage } from "./mission-control-types";

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  onboarding_vulnerability: "Onboarding",
  habit_formation: "Habit formation",
  momentum_identity: "Momentum",
  plateau_boredom_risk: "Plateau",
  emotional_disengagement: "Disengaging",
  at_risk_silent_quit: "At risk",
  win_back_window: "Win-back",
  churned: "Churned",
};

const CHANNEL_LABELS: Record<string, string> = {
  call: "Call",
  sms: "SMS",
  email: "Email",
  in_person: "In person",
  whatsapp: "WhatsApp",
};

const OUTCOME_LABELS: Record<string, string> = {
  rebooked: "Rebooked",
  attended_next: "Attended",
  no_response: "No response",
  still_at_risk: "Still at risk",
  freeze_requested: "Freeze",
  cancelled: "Cancelled",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

interface MissionControlMemberPanelProps {
  member: Member | null;
  coaches: Coach[];
  interactions: Interaction[];
  plays: RetentionPlay[];
  currentCoachId: string;
  interventionTimestamps: string[]; // for chart markers
  onReassign: (coachId: string) => void;
  onRunPlay: (play: RetentionPlay) => void;
  onQuickAction: (action: "message" | "call" | "schedule" | "note") => void;
  onMarkResolved: (resolved: boolean) => void;
  onAddInteraction: () => void;
  onEdit?: (memberId: string) => void;
  onPin?: (memberId: string) => void;
}

export default function MissionControlMemberPanel({
  member,
  coaches,
  interactions,
  plays,
  currentCoachId,
  interventionTimestamps,
  onReassign,
  onRunPlay,
  onQuickAction,
  onMarkResolved,
  onAddInteraction,
  onEdit,
  onPin,
}: MissionControlMemberPanelProps) {
  const [behaviourTab, setBehaviourTab] = useState<"activity" | "commitment" | "community" | "touch">("activity");
  const [reassignConfirm, setReassignConfirm] = useState(false);

  if (!member) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-700">Select a member from the inbox</p>
      </div>
    );
  }

  // Recommended plays based on lifecycle + risk reasons
  const recommendedPlays = plays.filter(
    (p) =>
      p.stageTargets.includes(member.lifecycleStage) ||
      member.riskReasons.some((r) => p.triggerReasons.some((tr) => r.toLowerCase().includes(tr.toLowerCase())))
  ).slice(0, 5);

  const chartData = member.attendanceSeries.map((p) => ({
    ...p,
    dateLabel: new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));

  const behaviourCharts = {
    activity: { data: member.attendanceSeries, key: "value", color: "#84cc16" },
    commitment: { data: member.commitmentSeries, key: "value", color: "#3b82f6" },
    community: { data: member.socialSeries, key: "value", color: "#8b5cf6" },
    touch: { data: member.touchSeries, key: "value", color: "#f59e0b" },
  };

  const chart = behaviourCharts[behaviourTab];
  const chartDataFormatted = chart.data.map((p) => ({
    ...p,
    dateLabel: new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));

  const owner = coaches.find((c) => c.id === member.coachOwnerId);

  return (
    <div className="space-y-4">
      {/* 1. Header card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-700">
              {getInitials(member.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <span className="rounded-full bg-lime-100 px-2.5 py-0.5 text-sm font-medium text-lime-800">
                  {member.commitmentScore}/100
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                  Decay velocity: {member.habitDecayVelocity}
                </span>
                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                  {LIFECYCLE_LABELS[member.lifecycleStage]}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                {member.riskReasons.join(" • ") || "At risk"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {reassignConfirm ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                      onChange={(e) => {
                        onReassign(e.target.value);
                        setReassignConfirm(false);
                      }}
                    >
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setReassignConfirm(false)}
                      className="text-xs text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-gray-700">Owner:</span>
                    <button
                      type="button"
                      onClick={() => setReassignConfirm(true)}
                      className="rounded bg-lime-50 px-2 py-1 text-xs font-medium text-lime-700 hover:bg-lime-100"
                    >
                      {owner?.name ?? "Unassigned"} – Reassign
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(member.id)}
                className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                title="Edit"
              >
                ✎
              </button>
            ) : (
              <Link
                href={`/members/${member.id}`}
                className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                title="Edit member"
              >
                ✎
              </Link>
            )}
            <Link
              href={`/members/${member.id}`}
              className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              title="Open profile"
            >
              👤
            </Link>
            {onPin ? (
              <button
                type="button"
                onClick={() => onPin(member.id)}
                className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                title="Pin"
              >
                📌
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 cursor-not-allowed"
                title="Pin (requires implementation)"
              >
                📌
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <CommitmentScoreGauge score={member.commitmentScore} size="small" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!member.isResolved}
              onChange={(e) => onMarkResolved(e.target.checked)}
              className="rounded border-gray-300 text-lime-500"
            />
            {member.isResolved ? "Mark Still At Risk" : "Mark Resolved"}
          </label>
        </div>
      </div>

      {/* 2. Behaviour Intelligence */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900">Behaviour Intelligence</h4>
        <div className="mt-2 flex gap-1">
          {(["activity", "commitment", "community", "touch"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBehaviourTab(t)}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${
                behaviourTab === t ? "bg-lime-100 text-lime-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataFormatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number | undefined) => [v ?? 0, "Value"]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chart.color}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-xs text-gray-700">Red dots = intervention points</p>
      </div>

      {/* 3. Intervention Plays */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900">Recommended Retention Plays</h4>
        <div className="mt-3 space-y-3">
          {recommendedPlays.length === 0 ? (
            <p className="text-sm text-gray-700">No plays match this member&apos;s stage/reasons</p>
          ) : (
            recommendedPlays.map((play) => (
              <div
                key={play.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{play.name}</span>
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-800">{play.category}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-700">
                    Why: {member.riskReasons.slice(0, 2).join(" + ")} + {LIFECYCLE_LABELS[member.lifecycleStage]}
                  </p>
                  <p className="text-xs text-gray-700">Channel: {play.suggestedChannel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRunPlay(play)}
                  className="shrink-0 rounded-lg bg-lime-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-lime-600"
                >
                  Run Play
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. One-click outreach bar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onQuickAction("message")}
          className="rounded-lg bg-lime-100 px-4 py-2 text-sm font-medium text-lime-800 hover:bg-lime-200"
        >
          Send Message
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("call")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Call Member
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("schedule")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Schedule Session
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("note")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Add Note
        </button>
      </div>

      {/* 5. Interaction Log */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Interaction Log</h4>
          <button
            type="button"
            onClick={onAddInteraction}
            className="text-xs font-medium text-lime-600 hover:text-lime-700"
          >
            + Add interaction
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {interactions.length === 0 ? (
            <li className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-700">
              No interactions yet
            </li>
          ) : (
            interactions.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <span className="text-xs text-gray-700">{formatDate(i.timestamp)} · {CHANNEL_LABELS[i.type] ?? i.type}</span>
                  {i.notes && <p className="mt-0.5 text-sm text-gray-700 line-clamp-2">{i.notes}</p>}
                  {i.followUpDate && (
                    <p className="mt-0.5 text-xs text-gray-700">Follow-up: {formatDate(i.followUpDate)}</p>
                  )}
                </div>
                {i.outcome && (
                  <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                    {OUTCOME_LABELS[i.outcome] ?? i.outcome}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
