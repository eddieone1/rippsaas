import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";

/**
 * Members at Risk Table - The main action driver of the dashboard
 * Shows only active members with high or medium risk
 * No filters, no configuration - just the most urgent members
 */
export default async function MembersAtRiskTable({ gymId }: { gymId: string }) {
  const supabase = await createClient();

  // Get only at-risk members (high + medium), sorted by risk score descending
  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .eq("gym_id", gymId)
    .eq("status", "active")
    .in("churn_risk_level", ["high", "medium"])
    .order("churn_risk_score", { ascending: false })
    .limit(20); // Show top 20 most at-risk

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error loading members: {error.message}</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No members at risk</h3>
        <p className="text-sm text-gray-600">
          All your active members are showing healthy engagement patterns.
        </p>
      </div>
    );
  }

  function getRiskBadgeColor(level: string) {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  function getDaysInactive(lastVisitDate: string | null): number | null {
    if (!lastVisitDate) return null;
    try {
      return differenceInDays(new Date(), parseISO(lastVisitDate));
    } catch {
      return null;
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Members at Risk</h2>
            <p className="mt-1 text-sm text-gray-600">
              {members.length} member{members.length !== 1 ? "s" : ""} need attention
            </p>
          </div>
          <Link
            href="/members/at-risk"
            className="text-sm font-medium text-lime-600 hover:text-lime-800"
          >
            View all →
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Last Visit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Days Inactive
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Risk Level
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {members.map((member) => {
              const daysInactive = getDaysInactive(member.last_visit_date);
              return (
                <tr 
                  key={member.id}
                  className={member.churn_risk_level === "high" ? "bg-red-50/30" : ""}
                >
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                    {member.first_name} {member.last_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {member.last_visit_date
                      ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
                      : "Never"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 font-medium">
                    {daysInactive !== null ? `${daysInactive} days` : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeColor(member.churn_risk_level)}`}
                    >
                      {member.churn_risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/members/${member.id}?from=dashboard`}
                      className="text-lime-600 hover:text-lime-800"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
