"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  joined_date: string;
  last_visit_date: string | null;
  status: "active" | "inactive" | "cancelled";
  churn_risk_score: number;
  churn_risk_level: string;
  payment_status: string | null;
  days_payment_late: number | null;
  age: number | null;
  employment_status: string | null;
  student_status: string | null;
  distance_from_gym_km: number | null;
  total_visits: number | null;
  visits_last_30_days: number | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postcode?: string | null;
}

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

import { formatMembershipStatus, getMembershipStatusBadgeColor } from "@/lib/membership-status";

function getStatusBadgeColor(status: string) {
  return getMembershipStatusBadgeColor(status);
}

function getPaymentStatusBadgeColor(status: string | null) {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status) {
    case "current":
      return "bg-green-100 text-green-800";
    case "late":
      return "bg-yellow-100 text-yellow-800";
    case "overdue":
      return "bg-orange-100 text-orange-800";
    case "missed":
      return "bg-red-100 text-red-800";
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

export default function MembersList({
  gymId,
  statusFilter,
  riskFilter,
  searchQuery,
}: {
  gymId: string;
  statusFilter: string;
  riskFilter: string;
  searchQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]); // Store all members for count calculations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localRiskFilter, setLocalRiskFilter] = useState(riskFilter);

  const fetchAllMembersForCounts = async () => {
    try {
      const response = await fetch(`/api/members`);
      const data = await response.json();
      const members = data.data?.members ?? data.members;
      if (members) {
        setAllMembers(members);
      }
    } catch (err) {
      // Silently fail - counts are not critical
    }
  };

  useEffect(() => {
    fetchMembers();
    if (statusFilter !== "all" || riskFilter !== "all") {
      fetchAllMembersForCounts();
    }
  }, [statusFilter, riskFilter, searchQuery]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (riskFilter !== "all") {
        params.append("risk", riskFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/members?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load members");
        return;
      }

      const fetchedMembers = data.data?.members ?? data.members ?? [];
      setMembers(fetchedMembers);
      // If no filters, store all members for count calculations
      if (statusFilter === "all" && riskFilter === "all") {
        setAllMembers(fetchedMembers);
      } else {
        // Fetch all members separately for counts
        fetchAllMembersForCounts();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    if (localRiskFilter !== "all") {
      params.set("risk", localRiskFilter);
    }
    if (localSearchQuery) {
      params.set("search", localSearchQuery);
    }
    router.push(`/members?${params.toString()}`);
    setLocalStatusFilter(status);
  };

  const handleRiskFilterChange = (risk: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (risk === "all") {
      params.delete("risk");
    } else {
      params.set("risk", risk);
    }
    if (localStatusFilter !== "all") {
      params.set("status", localStatusFilter);
    }
    if (localSearchQuery) {
      params.set("search", localSearchQuery);
    }
    router.push(`/members?${params.toString()}`);
    setLocalRiskFilter(risk);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (localSearchQuery) {
      params.set("search", localSearchQuery);
    } else {
      params.delete("search");
    }
    if (localStatusFilter !== "all") {
      params.set("status", localStatusFilter);
    }
    if (localRiskFilter !== "all") {
      params.set("risk", localRiskFilter);
    }
    router.push(`/members?${params.toString()}`);
  };

  // Members are already filtered by the API, so we can use them directly
  const filteredMembers = members;

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? "Loading..." : `Showing ${filteredMembers.length} member${filteredMembers.length !== 1 ? "s" : ""}`}
        </div>
        <Link
          href="/members/upload"
          className="inline-flex items-center rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
        >
          Upload Members
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4">
          {/* Status and Risk Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Membership status filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Membership status:</span>
            <button
              onClick={() => handleStatusFilterChange("all")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                localStatusFilter === "all"
                  ? "bg-lime-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({(allMembers.length > 0 ? allMembers : members).length})
            </button>
            <button
              onClick={() => handleStatusFilterChange("active")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                localStatusFilter === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.status === "active").length})
            </button>
            <button
              onClick={() => handleStatusFilterChange("inactive")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                localStatusFilter === "inactive"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inactive ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.status === "inactive").length})
            </button>
            <button
              onClick={() => handleStatusFilterChange("cancelled")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                localStatusFilter === "cancelled"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancelled ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.status === "cancelled").length})
            </button>
            </div>

            {/* Risk Level Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Risk Level:</span>
              <button
                onClick={() => handleRiskFilterChange("all")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  localRiskFilter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({(allMembers.length > 0 ? allMembers : members).length})
              </button>
              <button
                onClick={() => handleRiskFilterChange("high")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  localRiskFilter === "high"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                High ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.churn_risk_level === "high").length})
              </button>
              <button
                onClick={() => handleRiskFilterChange("medium")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  localRiskFilter === "medium"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Medium ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.churn_risk_level === "medium").length})
              </button>
              <button
                onClick={() => handleRiskFilterChange("low")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  localRiskFilter === "low"
                    ? "bg-lime-500 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Low ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.churn_risk_level === "low").length})
              </button>
              <button
                onClick={() => handleRiskFilterChange("none")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  localRiskFilter === "none"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                None ({(allMembers.length > 0 ? allMembers : members).filter((m) => m.churn_risk_level === "none").length})
              </button>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            />
            <button
              type="submit"
              className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No members found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Membership Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Visit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Days Inactive
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Risk Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredMembers.map((member) => {
                  const daysInactive = getDaysInactive(member.last_visit_date);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        {member.age && (
                          <div className="text-xs text-gray-500">Age: {member.age}</div>
                        )}
                        {(member.employment_status || member.student_status) && (
                          <div className="text-xs text-gray-500">
                            {member.student_status && member.student_status !== "not_student"
                              ? `Student (${member.student_status.replace("_", " ")})`
                              : member.employment_status?.replace("_", " ")}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        <div>{member.email || "-"}</div>
                        {member.phone && (
                          <div className="text-xs text-gray-500">{member.phone}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(member.status)}`}
                        >
                          {formatMembershipStatus(member.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {member.last_visit_date
                          ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
                          : "Never"}
                        {member.visits_last_30_days !== null && (
                          <div className="text-xs text-gray-500">
                            {member.visits_last_30_days} visits (30d)
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {daysInactive !== null ? `${daysInactive} days` : "-"}
                        {member.distance_from_gym_km !== null && typeof member.distance_from_gym_km === 'number' && (
                          <div className="text-xs text-gray-500">
                            {member.distance_from_gym_km.toFixed(1)} km away
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {member.payment_status ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentStatusBadgeColor(member.payment_status)}`}
                          >
                            {member.payment_status}
                            {member.days_payment_late && member.days_payment_late > 0 && (
                              <span className="ml-1">({member.days_payment_late}d)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRiskBadgeColor(member.churn_risk_level)}`}
                          >
                            {member.churn_risk_level}
                          </span>
                          <span className="text-xs text-gray-500">
                            Score: {member.churn_risk_score}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <Link
                          href={`/members/${member.id}?from=members`}
                          className="text-lime-600 hover:text-lime-900"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
