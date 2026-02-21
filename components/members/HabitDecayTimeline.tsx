"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimelineDataPoint {
  date: string;
  visits: number;
  commitmentScore: number | null;
}

interface HabitDecayTimelineProps {
  data: TimelineDataPoint[];
  /** Optional subtitle to show this timeline is for the specific member */
  memberSpecificLabel?: boolean;
}

/**
 * Habit Decay Timeline Chart
 * 
 * Shows commitment score trend over last 60 days
 * Helps visualize habit formation/decay
 */
export default function HabitDecayTimeline({ data, memberSpecificLabel }: HabitDecayTimelineProps) {
  // Format data for chart (show last 30 days for clarity)
  const chartData = data.slice(-30).map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    score: point.commitmentScore ?? 0,
    visits: point.visits,
  }));

  // Calculate trend (improving or declining)
  const recentScores = chartData
    .map((d) => d.score)
    .filter((s) => s > 0)
    .slice(-7);
  
  const trend =
    recentScores.length >= 2
      ? recentScores[recentScores.length - 1] - recentScores[0]
      : 0;

  const trendLabel = trend > 5 ? "Improving" : trend < -5 ? "Declining" : "Stable";
  const trendColor = trend > 5 ? "text-green-600" : trend < -5 ? "text-red-600" : "text-gray-600";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Habit Decay Timeline
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {memberSpecificLabel
              ? "This member's commitment score trend over the last 30 days (based on their visits)"
              : "Commitment score trend over last 30 days"}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${trendColor}`}>
            {trendLabel}
          </div>
          <div className="text-xs text-gray-500">
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)} points
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            label={{
              value: "Score",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}
            formatter={(value: number | undefined) => [`${value ?? 0}/100`, "Commitment Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#84cc16"
            strokeWidth={2}
            dot={{ fill: "#84cc16", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          {chartData[0]?.date} - {chartData[chartData.length - 1]?.date}
        </span>
        <span>
          {chartData.filter((d) => d.score > 0).length} days with data
        </span>
      </div>
    </div>
  );
}
