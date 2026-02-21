"use client";

import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface OutreachData {
  campaignsSent7d: number;
  campaignsBreakdown: { emails: number; sms: number; automations: number };
  campaignPerformance: Array<{
    date: string;
    emails: number;
    sms: number;
    automations: number;
    total: number;
  }>;
  engagementRate: number;
  engagementBreakdown: { emails: number; sms: number; automations: number };
}

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  padding: "10px 14px",
};

export default function OutreachPerformanceTab({ data }: { data: OutreachData }) {
  const { campaignsBreakdown, campaignPerformance } = data;

  const channelBarData = [
    { name: "Email", value: campaignsBreakdown.emails, fill: "#84cc16" },
    { name: "SMS", value: campaignsBreakdown.sms, fill: "#65a30d" },
    { name: "Automations", value: campaignsBreakdown.automations, fill: "#4d7c0f" },
  ].filter((d) => d.value > 0);

  const performanceData = campaignPerformance?.length
    ? campaignPerformance
    : [{ date: "—", emails: 0, sms: 0, automations: 0, total: 0 }];

  const bestChannel =
    campaignsBreakdown.emails >= campaignsBreakdown.sms
      ? "Email"
      : campaignsBreakdown.sms >= (campaignsBreakdown.automations || 0)
        ? "SMS"
        : "Automations";

  const cardClass = "rounded-xl border border-gray-200 bg-white p-6 shadow-md shadow-gray-200/50 hover:shadow-lg transition-shadow";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Outreach by channel</h3>
          <p className="text-xs text-gray-500 mb-4">Sends per channel in selected period</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelBarData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(132, 204, 22, 0.06)" }} />
              <Bar dataKey="value" name="Sends" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {channelBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-gray-500">
            Total: {campaignsBreakdown.emails + campaignsBreakdown.sms + (campaignsBreakdown.automations || 0)} sends
          </p>
        </div>

        <div className={cardClass}>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Channel engagement rates</h3>
          <p className="text-xs text-gray-500 mb-4">% who visited again after outreach</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-lime-50/30 p-4 hover:bg-lime-50/50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <span className="text-xl font-bold text-lime-600">
                {data.engagementBreakdown?.emails ?? 0}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-lime-50/30 p-4 hover:bg-lime-50/50 transition-colors">
              <span className="text-sm font-medium text-gray-700">SMS</span>
              <span className="text-xl font-bold text-lime-600">
                {data.engagementBreakdown?.sms ?? 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Outreach over time</h3>
            <p className="text-xs text-gray-500 mt-0.5">Emails, SMS and automations by period</p>
          </div>
          <Link
            href="/plays"
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-600 transition-colors"
          >
            View plays →
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={performanceData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Line
              type="monotone"
              dataKey="emails"
              name="Email"
              stroke="#84cc16"
              strokeWidth={2.5}
              dot={{ fill: "#84cc16", stroke: "#fff", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="sms"
              name="SMS"
              stroke="#65a30d"
              strokeWidth={2.5}
              dot={{ fill: "#65a30d", stroke: "#fff", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#374151"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-lime-200 bg-lime-50 p-5 text-sm text-gray-700">
        <p className="font-semibold text-gray-900 mb-2">Channel audit</p>
        <p>
          Best-performing channel by volume: <strong className="text-lime-800">{bestChannel}</strong>. Use the Plays page to
          configure automated outreach. Consistent touches to at-risk members drive re-engagement.
        </p>
      </div>
    </div>
  );
}
