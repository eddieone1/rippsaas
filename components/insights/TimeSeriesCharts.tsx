"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

interface TimeSeriesData {
  campaignsOverTime: Array<{ date: string; sent: number }>;
  successRateOverTime: Array<{ date: string; successRate: number; sent: number; reEngaged: number }>;
  reengagementOverTime: Array<{ date: string; reEngaged: number; sent: number }>;
  monthlyChurnRate: Array<{
    date: string;
    cancelled: number;
    totalAtStart: number;
    churnRate: number;
  }>;
  groupBy: string;
}

interface TimeSeriesChartsProps {
  timeRange: string;
}

export default function TimeSeriesCharts({ timeRange }: TimeSeriesChartsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    fetchTimeSeriesData();
  }, [timeRange, groupBy]);

  const fetchTimeSeriesData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (timeRange !== "all") {
        params.append("time_range", timeRange);
      }
      params.append("group_by", groupBy);

      const response = await fetch(`/api/interventions/time-series?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to load time series data");
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
      
    } catch (err) {
      console.error("Error fetching time series data:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Loading charts...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error || "No data available"}</p>
      </div>
    );
  }

  // Add market average to churn rate data
  const churnRateWithMarket = (data.monthlyChurnRate || []).map((item) => ({
    ...item,
    marketAverage: 5, // UK fitness industry average monthly churn rate
  }));

  // Don't show charts if no data
  if (
    (data.campaignsOverTime || []).length === 0 &&
    (data.successRateOverTime || []).length === 0 &&
    (data.reengagementOverTime || []).length === 0 &&
    churnRateWithMarket.length === 0
  ) {
    return null;
  }

  const chartCardClass = "rounded-xl border border-gray-200 bg-white p-6 shadow-md shadow-gray-200/50 hover:shadow-lg transition-shadow";
  const tooltipClass = {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    padding: "10px 14px",
  };

  return (
    <div className="space-y-6">
      {/* Group By Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Group by:</span>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as "day" | "week" | "month")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Outreach Sent Over Time */}
        {data.campaignsOverTime.length > 0 && (
          <div className={chartCardClass}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Outreach Sent Over Time
            </h3>
            <p className="text-xs text-gray-500 mb-4">Campaigns sent per period</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.campaignsOverTime} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="barLimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a3e635" />
                    <stop offset="100%" stopColor="#84cc16" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={tooltipClass} cursor={{ fill: "rgba(132, 204, 22, 0.08)" }} />
                <Bar dataKey="sent" fill="url(#barLimeGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Success Rate Over Time */}
        {data.successRateOverTime.length > 0 && (
          <div className={chartCardClass}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Success Rate Over Time
            </h3>
            <p className="text-xs text-gray-500 mb-4">% of members who visited again after outreach</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.successRateOverTime} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="successAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#6b7280" fontSize={12} label={{ value: "Success Rate (%)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                <Tooltip contentStyle={tooltipClass} formatter={(v: number | undefined) => [`${v ?? 0}%`, "Success Rate"]} />
                <Area
                  type="monotone"
                  dataKey="successRate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#successAreaGrad)"
                  dot={{ fill: "#10b981", stroke: "#fff", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reengagement Over Time */}
        {data.reengagementOverTime.length > 0 && (
          <div className={chartCardClass}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Members Who Visited Again Over Time
            </h3>
            <p className="text-xs text-gray-500 mb-4">Re-engaged members per period</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.reengagementOverTime} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="barEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={tooltipClass} cursor={{ fill: "rgba(16, 185, 129, 0.08)" }} />
                <Bar dataKey="reEngaged" fill="url(#barEmeraldGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Churn Rate - Above/below market visual */}
        <div className={chartCardClass}>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Monthly Churn Rate
          </h3>
          <p className="text-xs text-gray-500 mb-4">Your churn vs UK fitness benchmark (5%). Lower is better.</p>
          {churnRateWithMarket.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={churnRateWithMarket} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="churnAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <ReferenceArea y1={5} y2={10} fill="#fef2f2" fillOpacity={0.5} strokeOpacity={0} />
                  <ReferenceArea y1={0} y2={5} fill="#f0fdf4" fillOpacity={0.4} strokeOpacity={0} />
                  <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#6b7280" fontSize={12} domain={[0, "auto"]} label={{ value: "Churn %", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                  <Tooltip
                    contentStyle={tooltipClass}
                    formatter={(v: number | undefined, n?: string) => {
                      const val = v ?? 0;
                      const name = String(n ?? "");
                      if (name === "churnRate") return [`${val}%`, "Your Churn"];
                      if (name === "marketAverage") return [`${val}%`, "Market Avg"];
                      return [val, n];
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="churnRate" stroke="none" fill="url(#churnAreaGrad)" />
                  <Line
                    type="monotone"
                    dataKey="churnRate"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    name="Your Churn"
                    dot={{ fill: "#ef4444", stroke: "#fff", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marketAverage"
                    stroke="#6b7280"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    name="Market (5%)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Green = below market. Red zone = above market. Target: 3–5%.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] gap-3">
              <div className="text-4xl opacity-40">📊</div>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                No churn data yet. Send outreach and track visits to see your retention trends.
              </p>
              <a href="/plays" className="text-sm font-medium text-lime-600 hover:text-lime-700">
                Run a play →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
