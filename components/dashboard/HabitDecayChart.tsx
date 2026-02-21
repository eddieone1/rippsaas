"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DashboardMetricsData } from "@/components/dashboard/DashboardContent";

interface TrendDataPoint {
  date: string;
  dateLabel: string;
  avgCommitmentScore: number;
  memberCount: number;
}

type ChartRange = "1M" | "3M" | "6M" | "1Y";

/**
 * Habit Decay Trend Chart
 *
 * Real-time annotation of commitment score movement. Visible range: monthly (start to end of month).
 * Range options: 1M, 3M, 6M, 1Y. Data is daily recalculated from visits and commitment factors.
 */
export default function HabitDecayChart({
  initialData,
}: {
  initialData?: DashboardMetricsData | null;
}) {
  const [range, setRange] = useState<ChartRange>("1M");
  const [data, setData] = useState<TrendDataPoint[]>(initialData?.habitDecayTrend ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrendData();
  }, [range]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/metrics?range=${range}`);
      if (!response.ok) return;
      const metrics = await response.json();
      setData(metrics.habitDecayTrend || []);
    } catch (err) {
      console.error("Failed to fetch trend data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-50"></div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-600">No trend data available</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    date: point.dateLabel,
    score: point.avgCommitmentScore,
  }));

  // Calculate average for reference line
  const avgScore =
    chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length;

  // One-line summary
  const summary =
    avgScore >= 70
      ? "Commitment trend is healthy."
      : avgScore >= 50
        ? "Some members need attention."
        : "Low commitment – prioritise outreach.";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="mb-3 text-sm text-gray-600">{summary}</p>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Habit Decay Trend
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Commitment score by month – recency, consistency, tenure
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as ChartRange)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700"
        >
          <option value="1M">1 Month</option>
          <option value="3M">3 Months</option>
          <option value="6M">6 Months</option>
          <option value="1Y">1 Year</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            label={{
              value: "Commitment Score",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            formatter={(value: number | undefined) => [`${value ?? 0}/100`, "Score"]}
          />
          <ReferenceLine
            y={avgScore}
            stroke="#9ca3af"
            strokeDasharray="3 3"
            label={{ value: "Avg", position: "right" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#84cc16"
            strokeWidth={2}
            dot={{ fill: "#84cc16", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          Average: {Math.round(avgScore)}/100
        </span>
        <span>
          {chartData[0]?.date} - {chartData[chartData.length - 1]?.date}
        </span>
      </div>
    </div>
  );
}
