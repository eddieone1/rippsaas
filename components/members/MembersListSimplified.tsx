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
  last_visit_date: string | null;
  status: "active" | "inactive" | "cancelled";
  churn_risk_score: number;
  churn_risk_level: string;
  payment_status: string | null;
}

function getRiskBadgeColor(level: string) {
  switch (level) {
    case "high":
      return "bg-red-100 text-red-800 border-red-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
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

/**
 * Members List - Operational Control
 * Purpose: Filtering, searching, and segmentation
 * This page is about navigation, not decision-making
 */
export default function MembersListSimplified({
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localRiskFilter, setLocalRiskFilter] = useState(riskFilter);

  useEffect(() => {
    fetchMembers();
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

      setMembers(data.members || []);
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
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
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

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <div className="flex gap-1">
              {["all", "active", "inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setLocalStatusFilter(status);
                    handleStatusFilterChange(status);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    localStatusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Risk Level:</label>
            <div className="flex gap-1">
              {["all", "high", "medium", "low", "none"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => {
                    setLocalRiskFilter(risk);
                    handleRiskFilterChange(risk);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    localRiskFilter === risk
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Members Table */}
      {members.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No members found matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Last Visit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Days Inactive
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Risk Level
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {members.map((member) => {
                  const daysInactive = getDaysInactive(member.last_visit_date);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {member.email || member.phone || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(member.status)}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {member.last_visit_date
                          ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
                          : "Never"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                        {daysInactive !== null ? `${daysInactive} days` : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentStatusBadgeColor(member.payment_status)}`}
                        >
                          {member.payment_status || "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRiskBadgeColor(member.churn_risk_level)}`}
                          >
                            {member.churn_risk_level}
                          </span>
                          <span className="text-xs text-gray-500">Score: {member.churn_risk_score}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-blue-600 hover:text-blue-900"
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
