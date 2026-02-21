"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
interface ChurnedMember {
  id: string;
  name: string;
  email: string | null;
  status: string;
}

interface ChurnData {
  monthlyChurnRate: number;
  monthlyChurnRateTimeSeries: Array<{
    month: string;
    churnRate: number;
    churned: number;
    totalAtStart: number;
  }>;
  churnedMembersByMonth: Record<string, ChurnedMember[]>;
  memberStagesBreakdown: Array<{
    stage: string;
    label: string;
    count: number;
    play?: string;
  }>;
}

const MARKET_AVG = 5;

export default function ChurnReportTab({ data }: { data: ChurnData }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ChurnedMember | null>(null);

  const churnChartData = (data.monthlyChurnRateTimeSeries ?? []).map((row) => ({
    ...row,
    market: MARKET_AVG,
  }));

  const currentChurn = data.monthlyChurnRate ?? 0;
  const vsMarket = currentChurn - MARKET_AVG;
  const performanceReview =
    vsMarket <= 0
      ? `You are retaining members ${Math.abs(vsMarket).toFixed(1)}% better than the typical market benchmark. Keep up the retention efforts.`
      : `Your churn is ${vsMarket.toFixed(1)}% above the market average. Consider prioritising at-risk members and win-back outreach.`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Monthly Churn Rate</h3>
          <p className="text-xs text-gray-500 mb-4">Your churn vs 5% market benchmark. Lower is better.</p>
          <div className="text-3xl font-bold text-lime-600 mb-4">
            {data.monthlyChurnRate ?? 0}%
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={churnChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="churnReportAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <ReferenceArea y1={5} y2={10} fill="#fef2f2" fillOpacity={0.5} strokeOpacity={0} />
              <ReferenceArea y1={0} y2={5} fill="#f0fdf4" fillOpacity={0.4} strokeOpacity={0} />
              <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  padding: "10px 14px",
                }}
                formatter={(v: number | undefined, n?: string) => {
                  const val = v ?? 0;
                  if (n === "market") return [`${val}%`, "Market avg"];
                  return [`${val}%`, "Your churn"];
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="churnRate" stroke="none" fill="url(#churnReportAreaGrad)" />
              <Line
                type="monotone"
                dataKey="churnRate"
                name="Your churn"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ fill: "#ef4444", stroke: "#fff", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="market"
                name="Market (5%)"
                stroke="#6b7280"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-gray-500">Green = below market. Red zone = above market.</p>
          <div className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm text-lime-800 shadow-sm">
            <p className="font-medium mb-1">Performance vs market</p>
            <p>{performanceReview}</p>
            {vsMarket > 0 && (
              <Link
                href="/members/at-risk"
                className="mt-3 inline-block text-sm font-medium text-lime-700 hover:text-lime-800"
              >
                View at-risk members →
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col min-h-[340px]">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Members churned by month (click to view)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Expand a month to see members; click a name for profile or win-back.
          </p>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0 overflow-y-auto">
            {Object.entries(data.churnedMembersByMonth ?? {})
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 12)
              .map(([month, members]) => (
                <div
                  key={month}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedMonth === month
                      ? "border-lime-300 bg-lime-50/50 ring-2 ring-lime-200"
                      : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                    className="text-left w-full flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-semibold text-gray-900">{month}</span>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                  {selectedMonth === month && (
                    <ul className="mt-3 space-y-1.5 pl-0">
                      {members.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedMember(m)}
                            className="text-sm text-lime-600 hover:text-lime-800 hover:underline font-medium"
                          >
                            {m.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            {Object.keys(data.churnedMembersByMonth ?? {}).length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 gap-3">
                <div className="text-4xl opacity-40">📋</div>
                <p className="text-sm text-gray-500 text-center">No churned members in recent months</p>
                <Link href="/plays" className="text-sm font-medium text-lime-600 hover:text-lime-700">
                  Run a play →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Churned Member</h3>
            <p className="mt-2 text-gray-700">{selectedMember.name}</p>
            {selectedMember.email && (
              <p className="text-sm text-gray-500">{selectedMember.email}</p>
            )}
            <div className="mt-6 flex gap-3">
              <Link
                href={`/members/${selectedMember.id}`}
                className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
              >
                View profile
              </Link>
              <Link
                href={`/plays?winback=${selectedMember.id}`}
                className="rounded-md border border-lime-500 px-4 py-2 text-sm font-medium text-lime-700 hover:bg-lime-50"
              >
                Win-back play
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="mt-4 w-full rounded border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
