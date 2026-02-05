import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { differenceInDays, parseISO, format } from "date-fns";
import MemberActions from "./MemberActions";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  joined_date: string;
  last_visit_date: string | null;
  status: string;
  churn_risk_score: number;
  churn_risk_level: string;
  payment_status: string | null;
  visits_last_30_days?: number | null;
  total_visits?: number | null;
}

interface MembershipType {
  id: string;
  name: string;
  description: string | null;
}

interface TimelineEvent {
  id: string;
  type: "visit" | "message" | "automation" | "status_change";
  date: Date;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Member Detail - Retention Timeline (CRITICAL PAGE)
 * Purpose: Show a complete, chronological story of a member's engagement and risk
 * This is where retention actually happens
 */
export default async function RetentionTimeline({
  member,
  membershipTypes = [],
}: {
  member: Member;
  membershipTypes?: MembershipType[];
}) {
  const supabase = await createClient();

  const daysSinceLastVisit = member.last_visit_date
    ? differenceInDays(new Date(), parseISO(member.last_visit_date))
    : null;

  // Get member activities (visits)
  const { data: activities } = await supabase
    .from("member_activities")
    .select("*")
    .eq("member_id", member.id)
    .order("activity_date", { ascending: false });

  // Get campaign sends (messages and automations)
  const { data: campaignSends } = await supabase
    .from("campaign_sends")
    .select(
      `
      *,
      campaigns (
        name,
        trigger_days,
        channel
      )
    `
    )
    .eq("member_id", member.id)
    .order("sent_at", { ascending: false });

  // Build chronological timeline
  const timelineEvents: TimelineEvent[] = [];

  // Add visits
  activities?.forEach((activity) => {
    timelineEvents.push({
      id: activity.id,
      type: "visit",
      date: new Date(activity.activity_date),
      title: "Visit",
      description: `Member visited the gym`,
      metadata: { activity_type: activity.activity_type },
    });
  });

  // Add messages/automations
  campaignSends?.forEach((send: any) => {
    const campaign = send.campaigns;
    timelineEvents.push({
      id: send.id,
      type: send.campaigns?.trigger_days ? "automation" : "message",
      date: new Date(send.sent_at),
      title: send.campaigns?.trigger_days
        ? `Automation triggered: ${campaign?.name || "Campaign"}`
        : `Message sent: ${campaign?.name || "Campaign"}`,
      description: `${campaign?.channel?.toUpperCase() || "Email"} sent${send.member_re_engaged ? " - Member reengaged" : ""}`,
      metadata: {
        channel: send.channel,
        outcome: send.outcome,
        member_re_engaged: send.member_re_engaged,
      },
    });
  });

  // Sort by date (newest first)
  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Get risk explanation
  function getRiskExplanation(level: string, score: number): string {
    if (level === "high") {
      return "This member shows multiple signs of potential cancellation. Immediate action recommended.";
    } else if (level === "medium") {
      return "This member is showing some concerning patterns. Consider reaching out soon.";
    } else if (level === "low") {
      return "This member is generally engaged but showing minor risk signals.";
    }
    return "This member is showing healthy engagement patterns.";
  }

  function getRiskBadgeColor(level: string) {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/members"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Members
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {member.first_name} {member.last_name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getStatusBadgeColor(member.status)}`}
            >
              {member.status.toUpperCase()}
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getRiskBadgeColor(member.churn_risk_level)}`}
            >
              {member.churn_risk_level.toUpperCase()} RISK
            </span>
            {daysSinceLastVisit !== null && (
              <span className="text-sm text-gray-600">
                {daysSinceLastVisit} days inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Member Summary */}
        <div className="lg:col-span-1 space-y-4">
          {/* Membership Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Membership Status</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(member.status)}`}
                  >
                    {member.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(member.joined_date).toLocaleDateString('en-GB')}
                </dd>
              </div>
              {member.payment_status && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Payment Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.payment_status}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Last Visit */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Last Visit</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.last_visit_date
                    ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
                    : "Never"}
                </dd>
              </div>
              {daysSinceLastVisit !== null && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Days Since</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {daysSinceLastVisit} days
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Attendance Frequency */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Last 30 Days</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.visits_last_30_days || 0} visits
                </dd>
              </div>
              {member.total_visits !== null && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Total Visits</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.total_visits}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Risk Score Explanation */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Assessment</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Risk Score</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{member.churn_risk_score}/100</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Explanation</dt>
                <dd className="mt-1 text-xs text-gray-700">
                  {getRiskExplanation(member.churn_risk_level, member.churn_risk_score)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Suggested Actions Panel */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Suggested Actions</h3>
            <MemberActions member={member} />
          </div>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            
            {timelineEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0">
                      {event.type === "visit" && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-800">
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                      {event.type === "message" && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                          <span className="text-xs">✉</span>
                        </div>
                      )}
                      {event.type === "automation" && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-800">
                          <span className="text-xs">⚡</span>
                        </div>
                      )}
                      {event.type === "status_change" && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-800">
                          <span className="text-xs">↻</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="mt-1 text-xs text-gray-600">{event.description}</p>
                          {event.metadata?.member_re_engaged && (
                            <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                              Reengaged
                            </span>
                          )}
                        </div>
                        <time className="ml-4 flex-shrink-0 text-xs text-gray-500">
                          {format(event.date, "d MMM yyyy, HH:mm")}
                        </time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
