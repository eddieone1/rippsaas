import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";

function getRiskBadgeColor(level: string) {
  switch (level) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-lime-100 text-lime-800";
    default:
      return "bg-gray-100 text-gray-800";
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

export default async function MembersTable({ gymId }: { gymId: string }) {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .eq("gym_id", gymId)
    .eq("status", "active")
    .order("churn_risk_score", { ascending: false })
    .limit(50);

  if (error) {
    return <div className="text-red-600">Error loading members: {error.message}</div>;
  }

  if (!members || members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">No members found. Upload a CSV to get started.</p>
        <Link
          href="/members/upload"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload Members
        </Link>
      </div>
    );
  }

      return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow" data-tour="members-table">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Members at Risk</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Visit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Days Inactive
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {members.map((member) => {
                const daysInactive = getDaysInactive(member.last_visit_date);
                return (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {member.email || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {member.last_visit_date
                        ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
                        : "Never"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {daysInactive !== null ? `${daysInactive} days` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRiskBadgeColor(member.churn_risk_level)}`}
                      >
                        {member.churn_risk_level}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <Link
                        href={`/members/${member.id}?from=dashboard`}
                        className="text-lime-600 hover:text-lime-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
