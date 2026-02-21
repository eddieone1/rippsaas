"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CommitmentScoreGauge from "./CommitmentScoreGauge";
import HabitDecayTimeline from "./HabitDecayTimeline";
import RiskFlags from "./RiskFlags";
import RecommendedAction from "./RecommendedAction";
import SingleMemberCampaignModal from "./SingleMemberCampaignModal";
import MemberActions from "./MemberActions";
import CoachAssignment from "./CoachAssignment";
import EngagementHistory from "./EngagementHistory";
import MemberEditDetails from "./MemberEditDetails";

interface MemberProfileData {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    joinedDate: string;
    lastVisitDate: string | null;
    status: string;
    churnRiskScore: number;
    churnRiskLevel: string;
    specialNotes?: string | null;
  };
  memberIntelligence?: {
    memberStage: string;
    memberStageLabel: string;
    churnProbability: number;
    habitDecayIndex: number;
    emotionalDisengagementFlags: string[];
    behaviourInterpretation: string;
  };
  commitmentScore: {
    score: number;
    habitDecayVelocity: number;
    riskFlags: any;
    factorScores: any;
  };
  habitDecayTimeline: Array<{
    date: string;
    visits: number;
    commitmentScore: number | null;
  }>;
  engagementHistory: Array<{
    type: "visit" | "campaign";
    date: string;
    title: string;
    description: string;
    metadata?: any;
  }>;
  currentCoach: {
    id: string;
    name: string;
    email: string;
    assignedAt: string;
    assignedBy: string | null;
  } | null;
  coachHistory: Array<{
    coach: { id: string; name: string; email: string };
    assignedAt: string;
    assignedBy: string | null;
    notes: string | null;
  }>;
  recommendedAction: {
    action: string;
    priority: "high" | "medium" | "low";
    reason: string;
    suggestedCampaign?: string;
  };
  availableCoaches: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
}

interface MemberProfileProps {
  memberId: string;
  backFrom?: "dashboard" | "members" | "at-risk";
}

/**
 * Member Profile Component
 * 
 * This is where retention happens.
 * Comprehensive view of member engagement, risk, and actions.
 */
const BACK_LINKS: Record<string, { href: string; label: string }> = {
  dashboard: { href: "/dashboard", label: "Back to Dashboard" },
  members: { href: "/members", label: "Back to Members" },
  "at-risk": { href: "/members/at-risk", label: "Back to At Risk Members" },
};

export default function MemberProfile({ memberId, backFrom = "at-risk" }: MemberProfileProps) {
  const [data, setData] = useState<MemberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRunCampaignModal, setShowRunCampaignModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [memberId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${memberId}/profile`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const profileData = await response.json();
      setData(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error || "Failed to load profile"}</p>
      </div>
    );
  }

  const { member, memberIntelligence, commitmentScore, habitDecayTimeline, engagementHistory, currentCoach, recommendedAction, availableCoaches } = data;

  const getStageBadgeColor = (stage: string) => {
    const colors: Record<string, string> = {
      onboarding_vulnerability: "bg-amber-100 text-amber-800 border-amber-300",
      habit_formation: "bg-sky-100 text-sky-800 border-sky-300",
      momentum_identity: "bg-emerald-100 text-emerald-800 border-emerald-300",
      plateau_boredom_risk: "bg-orange-100 text-orange-800 border-orange-300",
      emotional_disengagement: "bg-rose-100 text-rose-800 border-rose-300",
      at_risk_silent_quit: "bg-red-100 text-red-800 border-red-300",
      win_back_window: "bg-violet-100 text-violet-800 border-violet-300",
    };
    return colors[stage] ?? "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-lime-100 text-lime-800 border-lime-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href={BACK_LINKS[backFrom]?.href ?? "/members/at-risk"}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← {BACK_LINKS[backFrom]?.label ?? "Back to At Risk Members"}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {memberIntelligence?.memberStage != null && (
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStageBadgeColor(
                  memberIntelligence.memberStage
                )}`}
              >
                {memberIntelligence.memberStageLabel}
              </span>
            )}
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getRiskBadgeColor(
                member.churnRiskLevel
              )}`}
            >
              {member.churnRiskLevel.toUpperCase()} RISK
            </span>
            {memberIntelligence?.churnProbability != null && (
              <span className="text-sm text-gray-600">
                Churn probability: {memberIntelligence.churnProbability}%
              </span>
            )}
            {memberIntelligence?.habitDecayIndex != null && (
              <span className="text-sm text-gray-600">
                Habit decay: {memberIntelligence.habitDecayIndex}/100
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Action - Prominent */}
      <RecommendedAction
        action={recommendedAction.action}
        priority={recommendedAction.priority}
        reason={recommendedAction.reason}
        suggestedCampaign={recommendedAction.suggestedCampaign}
        memberId={memberId}
        onRunCampaign={() => setShowRunCampaignModal(true)}
      />

      <SingleMemberCampaignModal
        open={showRunCampaignModal}
        onClose={() => setShowRunCampaignModal(false)}
        member={{
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          lastVisitDate: member.lastVisitDate,
          email: member.email,
          phone: member.phone,
        }}
        onSent={fetchProfile}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Key Metrics */}
        <div className="lg:col-span-1 space-y-6">
          {/* Commitment Score Gauge */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Commitment Score
            </h3>
            <CommitmentScoreGauge
              score={commitmentScore.score}
              size="large"
            />
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Velocity: {commitmentScore.habitDecayVelocity > 0 ? "+" : ""}
                {commitmentScore.habitDecayVelocity.toFixed(1)} visits/week
              </p>
            </div>
          </div>

          {/* Quick Actions (Send Email, Update Last Visit) */}
          <MemberActions
            member={{
              id: member.id,
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
            }}
            onActionComplete={fetchProfile}
          />

          {/* Behaviour interpretation & emotional flags */}
          {memberIntelligence && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Behaviour interpretation
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {memberIntelligence.behaviourInterpretation.replace(/\*\*/g, "")}
              </p>
              {memberIntelligence.emotionalDisengagementFlags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Emotional disengagement flags
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {memberIntelligence.emotionalDisengagementFlags.map((flag) => (
                      <li
                        key={flag}
                        className="inline-flex rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-800 border border-rose-200"
                      >
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Risk Flags */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <RiskFlags flags={commitmentScore.riskFlags} />
          </div>

          {/* Coach Assignment */}
          <CoachAssignment
            memberId={memberId}
            currentCoach={currentCoach}
            availableCoaches={availableCoaches}
            onAssign={fetchProfile}
          />

          {/* Coach & staff notes – prominent, always visible. Edit details opens modal for email/phone only. */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <MemberEditDetails
                memberId={memberId}
                email={member.email ?? ""}
                phone={member.phone ?? ""}
                specialNotes={member.specialNotes ?? ""}
                onSaved={fetchProfile}
                includeNotes={false}
              />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Add details for coaches and staff. Click Edit to update.
            </p>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 min-h-[80px]">
              {member.specialNotes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{member.specialNotes}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes yet</p>
              )}
            </div>
          </div>

          {/* Member Info + Edit */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Member Info</h3>
              <MemberEditDetails
                memberId={memberId}
                email={member.email ?? ""}
                phone={member.phone ?? ""}
                specialNotes={member.specialNotes ?? ""}
                onSaved={fetchProfile}
              />
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.email || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.phone || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(member.joinedDate).toLocaleDateString("en-GB")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Last Visit</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.lastVisitDate
                    ? new Date(member.lastVisitDate).toLocaleDateString("en-GB")
                    : "Never"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column - Timeline & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Habit Decay Timeline (specialised to this member) */}
          <HabitDecayTimeline data={habitDecayTimeline} memberSpecificLabel />

          {/* Engagement History */}
          <EngagementHistory events={engagementHistory} />
        </div>
      </div>
    </div>
  );
}
