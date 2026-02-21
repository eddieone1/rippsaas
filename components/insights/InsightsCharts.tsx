"use client";

import type { ChurnRiskBucket, StageCount } from "./insights-types";

interface ChartCardProps {
  title: string;
  /** Short text explaining how to interpret this chart or metric. */
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className = "" }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-white/[0.08] bg-[#2F3131] p-4 shadow-lg ${className}`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-white/55 leading-snug">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function StackedAreaChart({ data }: { data: ChurnRiskBucket[] }) {
  const width = 400;
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(
    ...data.map((d) => d.low + d.medium + d.high + d.at_risk + d.churned)
  );
  const keys = ["low", "medium", "high", "at_risk", "churned"] as const;
  const keyLabels: Record<(typeof keys)[number], string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    at_risk: "At Risk",
    churned: "Churned",
  };
  const colors = ["#4CAF50", "#FFC107", "#FF9800", "#F44336", "#333"];
  const step = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const points = keys.map((key, ki) => {
    const topY = data.map((d) => {
      let cum = 0;
      for (let k = 0; k <= ki; k++) cum += d[keys[k]];
      return padding.top + innerHeight - (cum / (max || 1)) * innerHeight;
    });
    const bottomY = ki === 0
      ? data.map(() => padding.top + innerHeight)
      : data.map((d) => {
          let cum = 0;
          for (let k = 0; k < ki; k++) cum += d[keys[k]];
          return padding.top + innerHeight - (cum / (max || 1)) * innerHeight;
        });
    const firstX = padding.left;
    const lastX = padding.left + (data.length - 1) * step;
    const topPoints = data.map((_, i) => `${padding.left + i * step},${topY[i]}`).join(" L ");
    const bottomPoints = data.map((_, i) => `${padding.left + i * step},${bottomY[i]}`).reverse().join(" L ");
    const path = `M ${firstX} ${bottomY[0]} L ${firstX} ${topY[0]} L ${topPoints} L ${lastX} ${topY[topY.length - 1]} L ${lastX} ${bottomY[bottomY.length - 1]} L ${bottomPoints} Z`;
    return { path, fill: colors[ki] };
  });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75">
        {keys.map((key, i) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: colors[i] }}
            />
            {keyLabels[key]}
          </span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          {colors.map((c, i) => (
            <linearGradient key={i} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={0.6} />
              <stop offset="100%" stopColor={c} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        {points.map((p, i) => (
          <path key={i} d={p.path} fill={`url(#area-${i})`} stroke={colors[i]} strokeWidth="0.5" />
        ))}
        <line x1={padding.left} y1={padding.top + innerHeight} x2={width - padding.right} y2={padding.top + innerHeight} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function BarChartHorizontal({
  data,
  max: maxProp,
  barColor = "#9EFF00",
}: {
  data: { label: string; value: number }[];
  max?: number;
  barColor?: string;
}) {
  const max = maxProp ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>{d.label}</span>
            <span>{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupedBarChart({ data }: { data: { week: string; values: number[] }[] }) {
  const colors = ["#9EFF00", "#FFC107", "#FF9800", "#F44336"];
  const max = Math.max(...data.flatMap((d) => d.values), 1);
  const barH = 8;
  const gap = 4;
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div key={row.week} className="flex items-center gap-2">
          <span className="w-16 text-xs text-white/65 shrink-0">{row.week}</span>
          <div className="flex-1 flex gap-0.5 h-6 items-end">
            {row.values.map((v, i) => (
              <div
                key={i}
                className="rounded-t flex-1 min-w-[4px]"
                style={{
                  height: `${(v / max) * 100}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComboChartBarLine({
  reached,
  responseRates,
}: {
  reached: number[];
  responseRates: number[];
}) {
  const width = 320;
  const height = 160;
  const padding = { left: 40, right: 20, top: 20, bottom: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxReached = Math.max(...reached, 1);
  const maxRate = Math.max(...responseRates, 1);
  const barW = innerW / reached.length - 4;
  const step = innerW / reached.length;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {reached.map((v, i) => {
        const x = padding.left + i * step + 2;
        const h = (v / maxReached) * innerH * 0.7;
        const y = padding.top + innerH - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={4}
            fill="#9EFF00"
            fillOpacity={0.4}
          />
        );
      })}
      <polyline
        points={responseRates
          .map((r, i) => {
            const x = padding.left + (i + 0.5) * step;
            const y = padding.top + innerH - (r / maxRate) * innerH * 0.8;
            return `${x},${y}`;
          })
          .join(" ")}
        fill="none"
        stroke="#9EFF00"
        strokeWidth="2"
      />
    </svg>
  );
}

export function StageSegmentBar({ stages }: { stages: StageCount[] }) {
  const total = stages.reduce((s, x) => s + x.count, 0);
  if (total === 0) return <div className="h-8 rounded-lg bg-white/10" />;
  return (
    <div className="space-y-2">
      <div className="flex h-10 rounded-xl overflow-hidden bg-white/5">
        {stages.map((s) => (
          <div
            key={s.stage}
            className="transition-all"
            style={{
              width: `${(s.count / total) * 100}%`,
              backgroundColor: s.color,
              minWidth: s.count ? 4 : 0,
            }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
        {stages.map((s) => (
          <span key={s.stage}>
            {s.label}: {s.count} ({total ? Math.round((s.count / total) * 100) : 0}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="h-32 w-32 rounded-full bg-white/10 mx-auto" />;
  const r = 48;
  let offset = 0;
  const segments = data.map((d) => {
    const ratio = d.value / total;
    const dash = 2 * Math.PI * r * ratio;
    const result = { color: d.color, dash, offset: 2 * Math.PI * r * offset };
    offset += ratio;
    return result;
  });
  return (
    <svg width="120" height="120" className="mx-auto -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="12"
          strokeDasharray={`${s.dash} ${2 * Math.PI * r}`}
          strokeDashoffset={-s.offset}
        />
      ))}
    </svg>
  );
}
