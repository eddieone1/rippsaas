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

/**
 * Habit Decay Trend Chart
 *
 * Shows average commitment score trend over last 30 days.
 * When initialData is provided (e.g. from DashboardContent), no fetch is made.
 */
export default function HabitDecayChart({
  initialData,
}: {
  initialData?: DashboardMetricsData | null;
}) {
  const [data, setData] = useState<TrendDataPoint[]>(initialData?.habitDecayTrend ?? []);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData?.habitDecayTrend) {
      setData(initialData.habitDecayTrend);
      setLoading(false);
      return;
    }
    fetchTrendData();
  }, [initialData]);

  const fetchTrendData = async () => {
    try {
      const response = await fetch("/api/dashboard/metrics");
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

  // Format data for chart (show last 14 days for clarity)
  const chartData = data.slice(-14).map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    score: point.avgCommitmentScore,
  }));

  // Calculate average for reference line
  const avgScore =
    chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Habit Decay Trend
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Average commitment score over last 14 days
        </p>
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
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: "#2563eb", r: 4 }}
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
