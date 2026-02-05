"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";

interface MonthlyData {
  month: string;
  membersAtStart: number;
  membersChurned: number;
  membersReengaged: number;
  revenueRetained: number;
}

interface BeforeAfterChartProps {
  monthlyTrend: MonthlyData[];
  baselineChurnRate: number;
  currentChurnRate: number;
  firstInterventionAt: string | null;
}

/**
 * Before & After — churn rate before vs after interventions.
 * Single bar comparison; optional inflection point where actions began.
 */
export default function BeforeAfterChart({
  monthlyTrend,
  baselineChurnRate,
  currentChurnRate,
  firstInterventionAt,
}: BeforeAfterChartProps) {
  const barData = [
    { label: "Churn before", rate: baselineChurnRate, fill: "#94a3b8" },
    { label: "Churn after", rate: currentChurnRate, fill: "#10b981" },
  ];

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Before vs after: churn rate
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Churn rate before using the platform vs after interventions. No
          overstyling.
        </p>
        {firstInterventionAt && (
          <p className="mt-1 text-xs text-gray-500">
            Inflection: actions began{" "}
            {new Date(firstInterventionAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Simple bar comparison */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={barData}
          margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}%`, "Churn rate"]}
          />
          <Legend />
          <Bar dataKey="rate" name="Churn rate" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Optional: monthly trend with inflection line */}
      {monthlyTrend && monthlyTrend.length > 0 && firstInterventionAt && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Monthly reengaged (inflection = when actions began)
          </h4>
          <MonthlyTrendWithInflection
            monthlyTrend={monthlyTrend}
            firstInterventionAt={firstInterventionAt}
          />
        </div>
      )}

      {(!monthlyTrend || monthlyTrend.length === 0) && !firstInterventionAt && (
        <p className="mt-4 text-center text-sm text-gray-500">
          No monthly trend data yet. Complete coach actions or run campaigns to
          see the inflection point.
        </p>
      )}
    </div>
  );
}

function MonthlyTrendWithInflection({
  monthlyTrend,
  firstInterventionAt,
}: {
  monthlyTrend: MonthlyData[];
  firstInterventionAt: string;
}) {
  const chartData = monthlyTrend.map((item) => {
    const [y, m] = item.month.split("-");
    const monthLabel = new Date(
      parseInt(y),
      parseInt(m) - 1
    ).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    return {
      month: monthLabel,
      monthKey: item.month,
      reengaged: item.membersReengaged,
      revenueRetained: Math.round(item.revenueRetained),
    };
  });

  const inflectionMonth = firstInterventionAt.slice(0, 7);
  const inflectionIndex = chartData.findIndex(
    (d) => d.monthKey === inflectionMonth
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          stroke="#6b7280"
          style={{ fontSize: "11px" }}
          angle={-45}
          textAnchor="end"
          height={56}
        />
        <YAxis stroke="#6b7280" style={{ fontSize: "11px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Legend />
        {inflectionIndex >= 0 && (
          <ReferenceLine
            x={chartData[inflectionIndex]?.month}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: "Actions began", position: "top" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="reengaged"
          name="Members reengaged"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
