"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

      const response = await fetch(`/api/interventions/time series?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to load time series data");
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
      
      // Debug logging
      console.log("Time series data:", result);
      console.log("Monthly churn rate:", result.monthlyChurnRate);
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

  return (
    <div className="space-y-6">
      {/* Group By Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Group by:</span>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as "day" | "week" | "month")}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaigns Sent Over Time */}
        {data.campaignsOverTime.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Campaigns Sent Over Time
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.campaignsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Success Rate Over Time */}
        {data.successRateOverTime.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Success Rate Over Time
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.successRateOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  label={{ value: "Success Rate (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, "Success Rate"]}
                />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reengagement Over Time */}
        {data.reengagementOverTime.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Members Reengaged Over Time
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.reengagementOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="reEngaged" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Churn Rate - Always show if there are members */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Monthly Churn Rate
          </h3>
          {churnRateWithMarket.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={churnRateWithMarket}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    label={{ value: "Churn Rate (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => {
                      const v = value ?? 0;
                      const n = name ?? "";
                      if (n === "churnRate") {
                        return [`${v}%`, "Your Churn Rate"];
                      }
                      if (n === "marketAverage") {
                        return [`${v}%`, "Market Average"];
                      }
                      return [v, n];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="churnRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Your Churn Rate"
                    dot={{ fill: "#ef4444", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marketAverage"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Market Average (5%)"
                    dot={{ fill: "#9ca3af", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Market average based on UK fitness industry benchmark (5% monthly churn)
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-sm text-gray-500">
                No churn data available yet. Churn rate will appear once you have members and cancellation data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
