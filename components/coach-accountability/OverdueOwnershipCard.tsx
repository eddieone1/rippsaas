"use client";

interface OverdueOwnershipCardProps {
  noCoach: number;
  overdueTouch: number;
  onAutoAssign: () => void;
}

export default function OverdueOwnershipCard({
  noCoach,
  overdueTouch,
  onAutoAssign,
}: OverdueOwnershipCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">Overdue & ownership</h3>
      <div className="mt-3 flex flex-wrap gap-6">
        <div>
          <p className="text-2xl font-bold text-gray-900">{noCoach}</p>
          <p className="text-xs text-gray-700">Members with no assigned coach</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{overdueTouch}</p>
          <p className="text-xs text-gray-700">Overdue for touch (&gt;10 days)</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAutoAssign}
        className="mt-4 rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-600"
      >
        Auto-assign
      </button>
    </div>
  );
}
