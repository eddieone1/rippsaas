"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateCampaignForm from "./CreateCampaignForm";
import RunCampaignModal from "./RunCampaignModal";
import SmsTemplatesSection from "./SmsTemplatesSection";

interface Campaign {
  id: string;
  name: string;
  trigger_days: number;
  status: string;
  channel: "email" | "sms";
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
}

export default function CampaignList({
  campaigns,
  gymId,
  templates,
}: {
  campaigns: Campaign[];
  gymId: string;
  templates: Template[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRunModal, setShowRunModal] = useState<number | null>(null);

  const handleRunCampaign = (triggerDays: number) => {
    setShowRunModal(triggerDays);
  };

  const handleRunCampaignSubmit = async (config: {
    triggerDays: number;
    channel: "email" | "sms";
    message_type: "template" | "custom";
    template_id?: string;
    custom_subject?: string;
    custom_body?: string;
  }) => {
    setError(null);
    setLoading(`${config.triggerDays}`);

    try {
      const response = await fetch("/api/campaigns/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to run campaign");
        setLoading(null);
        return;
      }

      setShowRunModal(null);
      router.refresh();
      const result = data.data ?? data;
      alert(`Campaign sent to ${result.sent} members!`);
      setLoading(null);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(null);
    }
  };

  const defaultTriggers = [21, 30, 60];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Create Campaign Form */}
      <CreateCampaignForm templates={templates} gymId={gymId} />

      {/* SMS Templates Section */}
      <SmsTemplatesSection
        templates={templates}
        onTemplatesUpdate={() => router.refresh()}
      />

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Run Engagement Campaign
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Send engagement messages (Email or SMS) to members who haven't visited in the selected number of days. Choose a template or create a custom message.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {defaultTriggers.map((days) => (
              <button
                key={days}
                onClick={() => handleRunCampaign(days)}
                disabled={loading !== null}
                className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === `${days}` 
                  ? "Sending..." 
                  : `${days}+ Days Inactive`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Campaign History
          </h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-gray-600">
              No campaigns have been run yet. Use the buttons above to send your first campaign.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Trigger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                        {campaign.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                          {campaign.channel?.toUpperCase() || "EMAIL"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {campaign.trigger_days} days inactive
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
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {/* Created date would be shown here */}
                        -
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Run Campaign Modal */}
      {showRunModal !== null && (
        <RunCampaignModal
          gymId={gymId}
          triggerDays={showRunModal}
          templates={templates}
          onClose={() => setShowRunModal(null)}
          onRun={handleRunCampaignSubmit}
          loading={loading !== null && loading === `${showRunModal}`}
        />
      )}
    </div>
  );
}
