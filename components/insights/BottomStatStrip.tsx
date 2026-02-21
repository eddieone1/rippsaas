"use client";

interface StatTile {
  label: string;
  value: string;
  accent?: boolean;
}

interface BottomStatStripProps {
  tiles: StatTile[];
}

export default function BottomStatStrip({ tiles }: BottomStatStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-white/[0.08] bg-[#2F3131] p-4 shadow"
        >
          <p className="text-xs font-medium text-white/65">{t.label}</p>
          <p className={`mt-1 text-xl font-bold ${t.accent ? "text-[#9EFF00]" : "text-white"}`}>
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
}
