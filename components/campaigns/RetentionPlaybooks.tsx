import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  trigger_days: number;
  status: string;
  channel: "email" | "sms";
  created_at: string;
}

interface CampaignSend {
  campaign_id: string;
  sent_at: string;
}

/**
 * Campaigns - Retention Playbooks
 * Purpose: Visibility into what's being sent, not marketing complexity
 * Read-only is acceptable for MVP
 */
export default async function RetentionPlaybooks({ gymId }: { gymId: string }) {
  const supabase = await createClient();

  // Get all campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });

  // Get send counts for each campaign
  const campaignIds = campaigns?.map((c) => c.id) || [];
  const { data: campaignSends } = await supabase
    .from("campaign_sends")
    .select("campaign_id, sent_at")
    .in("campaign_id", campaignIds);

  // Group sends by campaign
  const sendsByCampaign: Record<string, CampaignSend[]> = {};
  campaignSends?.forEach((send) => {
    if (!sendsByCampaign[send.campaign_id]) {
      sendsByCampaign[send.campaign_id] = [];
    }
    sendsByCampaign[send.campaign_id].push(send);
  });

  // Get most recent send date for each campaign
  const campaignStats = campaigns?.map((campaign) => {
    const sends = sendsByCampaign[campaign.id] || [];
    const lastSent = sends.length > 0
      ? new Date(Math.max(...sends.map((s) => new Date(s.sent_at).getTime())))
      : null;

    return {
      ...campaign,
      sentCount: sends.length,
      lastSent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <p className="mt-2 text-sm text-gray-600">
          View your retention campaigns and automations
        </p>
      </div>

      {/* Campaigns Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
        </div>
        {campaignStats && campaignStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Campaign Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Target Segment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Sent Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Last Sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaignStats.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                        {campaign.channel?.toUpperCase() || "EMAIL"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {campaign.trigger_days}+ days inactive
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
                        ? campaign.lastSent.toLocaleDateString('en-GB')
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-600">No campaigns configured yet.</p>
            <p className="mt-2 text-xs text-gray-500">
              Campaigns are created automatically when you run engagement actions.
            </p>
          </div>
        )}
      </div>

      {/* Recently Triggered Automations */}
      {campaignSends && campaignSends.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Triggered Automations
          </h2>
          <div className="space-y-2">
            {campaignSends
              .slice(0, 5)
              .map((send) => {
                const campaign = campaigns?.find((c) => c.id === send.campaign_id);
                return (
                  <div
                    key={send.campaign_id + send.sent_at}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {campaign?.name || "Campaign"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {campaign?.channel?.toUpperCase() || "EMAIL"} • {campaign?.trigger_days}+ days inactive
                      </p>
                    </div>
                    <time className="text-xs text-gray-500">
                      {new Date(send.sent_at).toLocaleDateString('en-GB')}
                    </time>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
