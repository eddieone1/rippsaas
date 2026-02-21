"use client";

interface Row {
  coach: { id: string; name: string };
  membersOwned: number;
  touchesThisWeek: number;
  touchPointsThisWeek: number;
  savesThisWeek: number;
  savedRevenueMRR: number;
}

interface LeaderboardTableProps {
  rows: Row[];
}

export default function LeaderboardTable({ rows }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 font-semibold text-gray-900">Coach</th>
            <th className="px-4 py-3 font-semibold text-gray-900">Members owned</th>
            <th className="px-4 py-3 font-semibold text-gray-900">Touches (this week)</th>
            <th className="px-4 py-3 font-semibold text-lime-600">Touch points</th>
            <th className="px-4 py-3 font-semibold text-gray-900">Saves</th>
            <th className="px-4 py-3 font-semibold text-gray-900">Saved revenue (MRR)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.coach.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium text-gray-900">{r.coach.name}</td>
              <td className="px-4 py-3 text-gray-700">{r.membersOwned}</td>
              <td className="px-4 py-3 text-gray-700">{r.touchesThisWeek}</td>
              <td className="px-4 py-3 font-semibold text-lime-600">
                {r.touchPointsThisWeek}
              </td>
              <td className="px-4 py-3 text-gray-700">{r.savesThisWeek}</td>
              <td className="px-4 py-3 text-gray-700">£{r.savedRevenueMRR}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
