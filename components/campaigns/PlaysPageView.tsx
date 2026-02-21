"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlaysSection from "./PlaysSection";
import AutoInterventionsSection from "./AutoInterventionsSection";
import RunCampaignModal from "./RunCampaignModal";
import CampaignDetailPanel from "./CampaignDetailPanel";
import CreateCampaignForm from "./CreateCampaignForm";
import SettingsToast from "@/components/settings/SettingsToast";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
  template_key?: string | null;
}

interface CampaignRow {
  id: string;
  name: string;
  trigger_days: number;
  status: string;
  channel: "email" | "sms";
  template_id?: string;
  target_segment?: string;
  include_cancelled?: boolean;
  sentCount: number;
  lastSent: Date | null;
  reEngaged?: number;
  successRate?: number;
}

interface PlaysPageViewProps {
  campaigns: CampaignRow[];
  templates: Template[];
  gymId: string;
}

type PlaysTab = "automated" | "send-now" | "history";

export default function PlaysPageView({
  campaigns,
  templates,
  gymId,
}: PlaysPageViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlaysTab>("send-now");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [whatsWorking, setWhatsWorking] = useState<{
    highest_performing: { template_id: string; template_name: string; success_rate: number; channel: string } | null;
    fastest_channel: { channel: string; avg_days: number } | null;
  } | null>(null);
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({});
  const [showRunModal, setShowRunModal] = useState(false);
  const [runModalConfig, setRunModalConfig] = useState<{
    triggerDays: number;
    initialTemplateId?: string;
    initialChannel?: "email" | "sms";
    initialTargetSegment?: "low" | "medium" | "high" | "all";
    initialIncludeCancelled?: boolean;
  }>({ triggerDays: 14 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/approvals/count")
      .then((r) => r.json())
      .then((d) => setPendingApprovalsCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  const fetchWhatsWorking = useCallback(() => {
    fetch("/api/interventions/performance?time_range=month")
      .then((r) => r.json())
      .then((data) => {
        if (data.insights) {
          const hp = data.insights.highest_performing;
          const fc = data.insights.fastest_to_bring_back;
          setWhatsWorking({
            highest_performing: hp
              ? {
                  template_id: hp.template_id,
                  template_name: hp.template_name,
                  success_rate: hp.success_rate,
                  channel: hp.channel,
                }
              : null,
            fastest_channel: fc
              ? { channel: fc.channel, avg_days: fc.avg_days_to_return ?? 0 }
              : null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const fetchAudienceCounts = useCallback(() => {
    fetch("/api/campaigns/audience-counts?trigger_days=14,21,30,60&channel=email")
      .then((r) => r.json())
      .then((d) => setAudienceCounts(d.counts ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWhatsWorking();
    fetchAudienceCounts();
  }, [fetchWhatsWorking, fetchAudienceCounts]);

  const templateByKey = (key: string, channel: "email" | "sms") =>
    templates.find(
      (t) =>
        (t.template_key === key || t.name.toLowerCase().includes(key.replace(/_/g, " "))) &&
        t.channel === channel
    );

  const quickWeHaventSeenYou =
    templateByKey("we_havent_seen_you", "email") ??
    templates.find((t) => t.name.includes("haven") && t.channel === "email");
  const quickBringAFriend =
    templateByKey("bring_a_friend", "email") ??
    templates.find((t) => t.name.toLowerCase().includes("bring a friend") && t.channel === "email");
  const quickWeMissYouDiscount =
    templateByKey("we_miss_you_discount", "email") ??
    templates.find(
      (t) =>
        t.name.toLowerCase().includes("miss you") &&
        t.name.toLowerCase().includes("discount") &&
        t.channel === "email"
    );

  const bestPerformerCampaign = campaigns
    .filter((c) => c.sentCount >= 3 && (c.successRate ?? 0) > 0)
    .sort((a, b) => (b.successRate ?? 0) - (a.successRate ?? 0))[0];

  const isRecommendedQuickSend = (triggerDays: number, templateId?: string) =>
    whatsWorking?.highest_performing &&
    templateId === whatsWorking.highest_performing.template_id;

  const openQuickRun = (
    triggerDays: number,
    templateId: string | undefined,
    channel: "email" | "sms"
  ) => {
    setRunModalConfig({
      triggerDays,
      initialTemplateId: templateId,
      initialChannel: channel,
    });
    setSelectedCampaignId(null);
    setShowRunModal(true);
  };

  const openRunAgain = (campaign: CampaignRow) => {
    setRunModalConfig({
      triggerDays: campaign.trigger_days,
      initialTemplateId: campaign.template_id,
      initialChannel: campaign.channel ?? "email",
      initialTargetSegment: campaign.target_segment as "low" | "medium" | "high" | "all",
      initialIncludeCancelled: campaign.include_cancelled ?? false,
    });
    setSelectedCampaignId(null);
    setShowRunModal(true);
  };

  const handleRunSubmit = async (config: {
    triggerDays: number;
    channel: "email" | "sms";
    message_type: "template" | "custom";
    template_id?: string;
    custom_subject?: string;
    custom_body?: string;
    target_segment?: "low" | "medium" | "high" | "all";
    include_cancelled?: boolean;
  }) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to run campaign");
        return;
      }
      setShowRunModal(false);
      router.refresh();
      fetchWhatsWorking();
      fetchAudienceCounts();
      const result = data.data ?? data;
      if (result.sent != null)
        setToastMessage(
          `Outreach sent to ${result.sent} members. Track performance in Insights in 14 days.`
        );
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const quickSendBtn = (
    label: string,
    triggerDays: number,
    templateId: string | undefined,
    channel: "email" | "sms",
    icon?: string
  ) => {
    const count = audienceCounts[String(triggerDays)] ?? null;
    const recommended = isRecommendedQuickSend(triggerDays, templateId);
    return (
      <button
        key={`${label}-${triggerDays}`}
        type="button"
        onClick={() => openQuickRun(triggerDays, templateId, channel)}
        className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all shadow-sm hover:shadow-md ${
          recommended
            ? "border-lime-400 bg-lime-50 text-lime-900 ring-2 ring-lime-300"
            : "border-gray-200 bg-white text-gray-700 hover:border-lime-300 hover:bg-lime-50/50"
        }`}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span>{label}</span>
          {recommended && (
            <span className="rounded-full bg-lime-500 px-2 py-0.5 text-xs font-semibold text-white">
              Best performer
            </span>
          )}
        </span>
        {count !== null && (
          <span className="mt-1 block text-xs text-gray-500">
            ~{count} member{count !== 1 ? "s" : ""} match
          </span>
        )}
      </button>
    );
  };

  const tabs = (
    <div className="flex flex-wrap gap-2 border-b border-gray-200">
      <button
        onClick={() => setActiveTab("automated")}
        className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "automated"
            ? "border-b-2 border-lime-600 text-lime-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Automated
      </button>
      <button
        onClick={() => setActiveTab("send-now")}
        className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "send-now"
            ? "border-b-2 border-lime-600 text-lime-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Send now
      </button>
      <button
        onClick={() => setActiveTab("history")}
        className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "history"
            ? "border-b-2 border-lime-600 text-lime-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        History & performance
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plays</h1>
        <p className="mt-2 text-sm text-gray-600">
          Automated plays run daily and need approval. One-off sends go out immediately. Prove what works in Insights.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <SettingsToast
        message={toastMessage ?? ""}
        visible={!!toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

      {pendingApprovalsCount > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-amber-900">
            {pendingApprovalsCount} intervention{pendingApprovalsCount !== 1 ? "s" : ""} awaiting approval
          </p>
          <Link
            href="/approvals"
            className="mt-2 inline-block text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            Review now →
          </Link>
        </div>
      )}

      {/* What's working strip */}
      {whatsWorking && (whatsWorking.highest_performing || whatsWorking.fastest_channel) && (
        <div className="rounded-xl border border-lime-200 bg-gradient-to-br from-lime-50 to-emerald-50 p-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/20 text-xl">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-semibold text-lime-900">What&apos;s working</h3>
                {whatsWorking.highest_performing && (
                  <p className="mt-0.5 text-sm text-lime-800">
                    Best performer: &ldquo;{whatsWorking.highest_performing.template_name}&rdquo; —{" "}
                    {whatsWorking.highest_performing.success_rate}% re-engaged
                    {whatsWorking.fastest_channel && (
                      <> · {whatsWorking.fastest_channel.channel} brings members back in ~{whatsWorking.fastest_channel.avg_days} days</>
                    )}
                  </p>
                )}
                {!whatsWorking.highest_performing && whatsWorking.fastest_channel && (
                  <p className="mt-0.5 text-sm text-lime-800">
                    {whatsWorking.fastest_channel.channel} brings members back in ~{whatsWorking.fastest_channel.avg_days} days
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/insights?tab=whats-working"
              className="shrink-0 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
            >
              See full analysis →
            </Link>
          </div>
        </div>
      )}

      {tabs}

      {/* Tab: Automated */}
      {activeTab === "automated" && (
        <div className="space-y-6">
          <AutoInterventionsSection gymId={gymId} />
          <PlaysSection />
        </div>
      )}

      {/* Tab: Send now */}
      {activeTab === "send-now" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Quick sends</h3>
            <p className="text-sm text-gray-600 mb-4">
              One click to send. Choose channel, segment, and include cancelled in the modal.
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Re-engage</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickSendBtn("14+ days inactive", 14, quickWeHaventSeenYou?.id, "email", "📅")}
                  {quickSendBtn("21+ days inactive", 21, quickWeHaventSeenYou?.id, "email", "📅")}
                  {quickSendBtn("30+ days inactive", 30, quickWeHaventSeenYou?.id, "email", "📅")}
                  {quickSendBtn("60+ days inactive", 60, quickWeHaventSeenYou?.id, "email", "📅")}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Win-back</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {quickSendBtn("Bring a friend on us", 14, quickBringAFriend?.id, "email", "🎁")}
                  {quickSendBtn("We miss you (discount offer)", 14, quickWeMissYouDiscount?.id, "email", "💌")}
                </div>
              </div>
            </div>
          </div>
          <CreateCampaignForm templates={templates} gymId={gymId} />
        </div>
      )}

      {/* Tab: History & performance */}
      {activeTab === "history" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Send history</h2>
              <p className="mt-1 text-sm text-gray-500">
                One-off campaigns you&apos;ve sent. Click a row for details.
              </p>
              {campaigns.length > 0 && bestPerformerCampaign && (
                <p className="mt-2 text-xs text-lime-700">
                  Last 30 days best: {bestPerformerCampaign.name} — {bestPerformerCampaign.successRate}% re-engaged
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href="/approvals"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Approvals queue
              </Link>
              <Link
                href="/logs"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Intervention logs
              </Link>
              <Link
                href="/insights?tab=whats-working"
                className="rounded-lg bg-lime-500 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-lime-400"
              >
                Prove it →
              </Link>
            </div>
          </div>
          {campaigns && campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Campaign name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Sent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Success
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Last sent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {campaigns.map((campaign) => {
                    const isBest = bestPerformerCampaign?.id === campaign.id;
                    return (
                      <tr
                        key={campaign.id}
                        onClick={() => setSelectedCampaignId(campaign.id)}
                        className="cursor-pointer hover:bg-lime-50/50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          <span className="flex items-center gap-2">
                            {campaign.name}
                            {isBest && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                Best performer
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-lime-100 text-lime-800">
                            {campaign.channel?.toUpperCase() ?? "EMAIL"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {campaign.target_segment ?? "all"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                          {campaign.sentCount}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          {campaign.sentCount > 0 ? (
                            <span className="font-medium text-green-700">
                              {campaign.successRate ?? 0}% ({campaign.reEngaged ?? 0}/{campaign.sentCount})
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {campaign.lastSent
                            ? campaign.lastSent.toLocaleDateString("en-GB")
                            : "Never"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRunAgain(campaign);
                              }}
                              className="text-sm font-medium text-lime-600 hover:text-lime-700"
                            >
                              Run again
                            </button>
                            <Link
                              href="/insights?tab=whats-working"
                              className="text-sm font-medium text-gray-500 hover:text-gray-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Insights
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="text-5xl opacity-50 mb-4">📬</div>
              <p className="text-sm font-medium text-gray-900">No sends yet</p>
              <p className="mt-2 text-sm text-gray-600 max-w-sm">
                1. Pick a threshold (14+, 21+, 30+, 60+ days inactive) · 2. Send · 3. Check Insights in 14 days
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("send-now")}
                  className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
                >
                  Send now →
                </button>
                <Link
                  href="/insights?tab=whats-working"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Insights
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail panel for a selected campaign */}
      {selectedCampaignId && (
        <CampaignDetailPanel
          campaignId={selectedCampaignId}
          onClose={() => setSelectedCampaignId(null)}
          onRunSimilar={(config) => {
            setSelectedCampaignId(null);
            const seg = config.target_segment;
            const validSegment =
              seg === "low" || seg === "medium" || seg === "high" || seg === "all" ? seg : undefined;
            setRunModalConfig({
              triggerDays: config.trigger_days,
              initialTemplateId: config.template_id,
              initialChannel: (config.channel as "email" | "sms") ?? "email",
              initialTargetSegment: validSegment,
              initialIncludeCancelled: config.include_cancelled,
            });
            setShowRunModal(true);
          }}
        />
      )}

      {/* Run campaign modal */}
      {showRunModal && (
        <RunCampaignModal
          gymId={gymId}
          triggerDays={runModalConfig.triggerDays}
          templates={templates}
          onClose={() => setShowRunModal(false)}
          onRun={handleRunSubmit}
          loading={loading}
          initialTemplateId={runModalConfig.initialTemplateId}
          initialChannel={runModalConfig.initialChannel}
          initialTargetSegment={runModalConfig.initialTargetSegment}
          initialIncludeCancelled={runModalConfig.initialIncludeCancelled}
          recommendedTemplateId={whatsWorking?.highest_performing?.template_id}
        />
      )}
    </div>
  );
}
