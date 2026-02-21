"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CampaignDetailPanelProps {
  campaignId: string | null;
  onClose: () => void;
  onRunSimilar?: (config: {
    trigger_days: number;
    channel: string;
    template_id?: string;
    target_segment?: string;
    include_cancelled?: boolean;
  }) => void;
}

interface Insights {
  total_sent: number;
  re_engaged: number;
  no_response: number;
  cancelled: number;
  pending: number;
  success_rate: number;
  avg_days_to_return: number | null;
}

interface CampaignDetail {
  campaign: {
    id: string;
    name: string;
    trigger_type: string;
    trigger_days: number;
    channel: string;
    status: string;
    template_id?: string;
    target_segment?: string;
    include_cancelled?: boolean;
    created_at: string;
    campaign_templates?: { name: string; subject: string; body: string; channel: string; template_key?: string | null };
  };
  insights: Insights;
  recent_sends: { id: string; sent_at: string; outcome: string | null; days_to_return: number | null; member_id: string }[];
}

export default function CampaignDetailPanel({ campaignId, onClose, onRunSimilar }: CampaignDetailPanelProps) {
  const router = useRouter();
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load send details");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Could not load send details"))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (!campaignId) return null;
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send details</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send details</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <p className="py-8 text-center text-sm text-red-600">{error || "Not found"}</p>
      </div>
    );
  }

  const { campaign, insights } = data;
  const template = campaign.campaign_templates;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{campaign.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sent</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{insights.total_sent}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Visited Again</p>
            <p className="mt-1 text-2xl font-semibold text-green-800">{insights.re_engaged}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">No response</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{insights.no_response}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Success rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{insights.success_rate}%</p>
          </div>
        </div>
        {insights.avg_days_to_return != null && (
          <p className="text-sm text-gray-600">
            Average days to return after send: <strong>{insights.avg_days_to_return}</strong> days
          </p>
        )}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Targeting</p>
          <p className="mt-1 text-sm text-gray-600">
            Channel: <span className="font-medium">{campaign.channel}</span>
            {" · "}
            Segment: <span className="font-medium">{campaign.target_segment ?? "all"}</span>
            {campaign.include_cancelled ? " · Includes cancelled members" : ""}
          </p>
          {template && (
            <p className="mt-2 text-sm text-gray-600">
              Template: {template.name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/members/at-risk?campaign=${campaign.id}`}
            className="inline-flex items-center rounded-md bg-lime-500 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
          >
            View at risk members
          </Link>
          {onRunSimilar && (
            <button
              type="button"
              onClick={() =>
                onRunSimilar({
                  trigger_days: campaign.trigger_days ?? 14,
                  channel: campaign.channel ?? "email",
                  template_id: campaign.template_id,
                  target_segment: campaign.target_segment ?? "all",
                  include_cancelled: campaign.include_cancelled ?? false,
                })
              }
              className="inline-flex items-center rounded-md border border-lime-500 px-3 py-2 text-sm font-medium text-lime-700 hover:bg-lime-50"
            >
              Send similar
            </button>
          )}
          <Link
            href="/insights?tab=whats-working"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View in Insights
          </Link>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
