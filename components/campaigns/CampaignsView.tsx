"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateCampaignForm from "./CreateCampaignForm";
import RunCampaignModal from "./RunCampaignModal";
import CampaignDetailPanel from "./CampaignDetailPanel";
import AutoInterventionsSection from "./AutoInterventionsSection";
import PlaysSection from "./PlaysSection";

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
  target_segment?: string;
  include_cancelled?: boolean;
  sentCount: number;
  lastSent: Date | null;
}

interface CampaignsViewProps {
  campaigns: CampaignRow[];
  templates: Template[];
  gymId: string;
}

export default function CampaignsView({
  campaigns,
  templates,
  gymId,
}: CampaignsViewProps) {
  const router = useRouter();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [runModalConfig, setRunModalConfig] = useState<{
    triggerDays: number;
    initialTemplateId?: string;
    initialChannel?: "email" | "sms";
  }>({ triggerDays: 14 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateByKey = (key: string, channel: "email" | "sms") =>
    templates.find((t) => (t.template_key === key || t.name.toLowerCase().includes(key.replace(/_/g, " "))) && t.channel === channel);

  const quickWeHaventSeenYou = templateByKey("we_havent_seen_you", "email") ?? templates.find((t) => t.name.includes("haven") && t.channel === "email");
  const quickBringAFriend = templateByKey("bring_a_friend", "email") ?? templates.find((t) => t.name.toLowerCase().includes("bring a friend") && t.channel === "email");
  const quickWeMissYouDiscount = templateByKey("we_miss_you_discount", "email") ?? templates.find((t) => t.name.toLowerCase().includes("miss you") && t.name.toLowerCase().includes("discount") && t.channel === "email");

  const openQuickRun = (triggerDays: number, templateId: string | undefined, channel: "email" | "sms") => {
    setRunModalConfig({ triggerDays, initialTemplateId: templateId, initialChannel: channel });
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
      const result = data.data ?? data;
      if (result.sent != null) alert(`Campaign sent to ${result.sent} members.`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and run retention campaigns, use templates for quick execution, and zoom in on performance.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <CreateCampaignForm templates={templates} gymId={gymId} />

      {/* Template quick actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick template campaigns</h2>
        <p className="text-sm text-gray-600 mb-4">
          Run a campaign with one click using a preset message. You can still choose channel, target segment, and whether to include cancelled members before sending.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openQuickRun(14, quickWeHaventSeenYou?.id, "email")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            We haven&apos;t seen you in a while
          </button>
          <button
            type="button"
            onClick={() => openQuickRun(14, quickBringAFriend?.id, "email")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            Bring a friend on us
          </button>
          <button
            type="button"
            onClick={() => openQuickRun(14, quickWeMissYouDiscount?.id, "email")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            We miss you (membership discount offer)
          </button>
        </div>
      </div>

      {/* Automated interventions: toggle + approval queue */}
      <AutoInterventionsSection gymId={gymId} />

      {/* Intervention plays management */}
      <PlaysSection />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active campaigns</h2>
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
                    Target segment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Sent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Last sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className="cursor-pointer hover:bg-lime-50 focus:bg-lime-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-lime-100 text-lime-800">
                        {campaign.channel?.toUpperCase() ?? "EMAIL"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {campaign.target_segment ?? "all"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          campaign.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                      {campaign.sentCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {campaign.lastSent
                        ? campaign.lastSent.toLocaleDateString("en-GB")
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-600">No campaigns yet.</p>
            <p className="mt-2 text-xs text-gray-500">
              Use &quot;Create a campaign&quot; or a quick template above to get started.
            </p>
          </div>
        )}
      </div>

      {selectedCampaignId && (
        <CampaignDetailPanel
          campaignId={selectedCampaignId}
          onClose={() => setSelectedCampaignId(null)}
        />
      )}

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
        />
      )}
    </div>
  );
}
