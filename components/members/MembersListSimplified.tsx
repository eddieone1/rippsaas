"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import { formatMembershipStatus, getMembershipStatusBadgeColor } from "@/lib/membership-status";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  last_visit_date: string | null;
  date_of_birth?: string | null;
  status: "active" | "inactive" | "cancelled";
  churn_risk_score: number;
  churn_risk_level: string;
  commitment_score?: number | null;
  payment_status: string | null;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Counts {
  all: number;
  active: number;
  inactive: number;
  cancelled: number;
  high: number;
  medium: number;
  low: number;
  none: number;
  birthdaysThisMonth: number;
}

function getRiskBadgeColor(level: string) {
  switch (level) {
    case "high":
      return "bg-red-100 text-red-800 border-red-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low":
      return "bg-lime-100 text-lime-800 border-lime-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const MEMBER_COUNTS: Record<string, keyof Counts> = {
  all: "all",
  active: "active",
  inactive: "inactive",
  high: "high",
  medium: "medium",
  low: "low",
  none: "none",
};

export default function MembersListSimplified({
  gymId,
  statusFilter,
  riskFilter,
  searchQuery,
  birthdaysFilter = "",
  page = "1",
}: {
  gymId: string;
  statusFilter: string;
  riskFilter: string;
  searchQuery: string;
  birthdaysFilter?: string;
  page?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localRiskFilter, setLocalRiskFilter] = useState(riskFilter);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(localSearchQuery, 400);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/members/counts");
      const data = await res.json();
      setCounts(data);
    } catch {
      setCounts(null);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, statusFilter, riskFilter, birthdaysFilter]);

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, riskFilter, debouncedSearch, birthdaysFilter, page]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (riskFilter !== "all") params.append("risk", riskFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (birthdaysFilter) params.append("birthdays", birthdaysFilter);
      params.append("page", page);
      params.append("limit", "50");

      const response = await fetch(`/api/members?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load members");
        return;
      }

      setMembers(data.members ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "all");
    if (status === "all") params.delete("status");
    else params.set("status", status);
    if (localRiskFilter !== "all") params.set("risk", localRiskFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.delete("page");
    router.push(`/members?${params.toString()}`);
  };

  const handleRiskFilterChange = (risk: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "all");
    if (risk === "all") params.delete("risk");
    else params.set("risk", risk);
    if (localStatusFilter !== "all") params.set("status", localStatusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.delete("page");
    router.push(`/members?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
  };

  const buildParamsWithSearch = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "all");
    if (debouncedSearch) params.set("search", debouncedSearch);
    Object.entries(updates).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    return params;
  };

  const handleQuickSendEmail = async (memberId: string) => {
    setSendingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_type: "we_miss_you" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      fetchMembers();
      fetchCounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  const handleClearFilters = () => {
    router.push("/members?tab=all");
  };

  const hasActiveFilters = statusFilter !== "all" || riskFilter !== "all" || debouncedSearch || birthdaysFilter;
  const isFilteredEmpty = members.length === 0 && total === 0 && hasActiveFilters;

  if (loading && members.length === 0) {
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
      {/* Filter Bar - search prominent, filters collapsible */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                showFilters || hasActiveFilters
                  ? "bg-lime-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showFilters ? "Hide filters" : "Filters"}
              {hasActiveFilters && !showFilters && " •"}
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <div className="flex gap-1">
                  {(["all", "active", "inactive"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setLocalStatusFilter(status);
                    handleStatusFilterChange(status);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    localStatusFilter === status
                      ? "bg-lime-500 text-gray-900"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "all"
                    ? `All${counts ? ` (${counts.all})` : ""}`
                    : `${status.charAt(0).toUpperCase() + status.slice(1)}${counts ? ` (${counts[MEMBER_COUNTS[status]] ?? 0})` : ""}`}
                </button>
              ))}
            </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium text-gray-700">Risk:</label>
                <div className="flex gap-1">
                  {(["all", "high", "medium", "low", "none"] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => {
                    setLocalRiskFilter(risk);
                    handleRiskFilterChange(risk);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    localRiskFilter === risk
                      ? "bg-lime-500 text-gray-900"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {risk === "all"
                    ? `All${counts ? ` (${counts.all})` : ""}`
                    : `${risk.charAt(0).toUpperCase() + risk.slice(1)}${counts ? ` (${counts[MEMBER_COUNTS[risk]] ?? 0})` : ""}`}
                </button>
              ))}
            </div>
          </div>
              {!birthdaysFilter && counts && counts.birthdaysThisMonth > 0 && (
                <Link
                  href="/members?tab=birthdays"
                  className="self-start rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                >
                  🎂 Birthdays this month ({counts.birthdaysThisMonth})
                </Link>
              )}
            </div>
          )}
          {localSearchQuery !== debouncedSearch && (
            <span className="text-xs text-gray-500">Searching...</span>
          )}
        </div>
      </div>

      {/* Empty states */}
      {members.length === 0 && total === 0 && !hasActiveFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            Upload your member list to start tracking retention and reaching out to at-risk members.
          </p>
          <Link
            href="/members/upload"
            className="inline-flex items-center justify-center rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
          >
            Upload member list →
          </Link>
        </div>
      )}

      {isFilteredEmpty && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">No members found matching your filters.</p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm font-medium text-lime-600 hover:text-lime-800"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Members - Card view on mobile */}
      {members.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {members.map((member) => {
              const daysInactive = getDaysInactive(member.last_visit_date);
              const isAtRisk = ["high", "medium", "low"].includes(member.churn_risk_level);
              return (
                <div
                  key={member.id}
                  className={`rounded-lg border bg-white p-4 shadow-sm ${
                    member.churn_risk_level === "high" ? "border-red-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.email || member.phone || "-"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskBadgeColor(member.churn_risk_level)}`}>
                          {member.churn_risk_level}
                        </span>
                        {member.commitment_score != null && (
                          <span className="text-xs text-gray-600">{member.commitment_score}/100</span>
                        )}
                      </div>
                      {member.last_visit_date && daysInactive !== null && (
                        <p className="mt-1 text-xs text-gray-500">{daysInactive} days inactive</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {isAtRisk && member.email && (
                        <button
                          type="button"
                          onClick={() => handleQuickSendEmail(member.id)}
                          disabled={sendingId === member.id}
                          className="rounded-md bg-lime-500 px-2.5 py-1 text-xs font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
                        >
                          {sendingId === member.id ? "…" : "Email"}
                        </button>
                      )}
                      <Link
                        href={`/members/${member.id}?from=members`}
                        className="text-right text-xs font-medium text-lime-600 hover:text-lime-800"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table view on desktop */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Commitment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Last Visit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Days Inactive</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Risk</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {members.map((member) => {
                    const daysInactive = getDaysInactive(member.last_visit_date);
                    const isAtRisk = ["high", "medium", "low"].includes(member.churn_risk_level);
                    return (
                      <tr key={member.id} className={`hover:bg-gray-50 ${member.churn_risk_level === "high" ? "bg-red-50/30" : ""}`}>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {member.email || member.phone || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(member.status)}`}>
                            {formatMembershipStatus(member.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          {member.commitment_score != null ? (
                            <span className="font-medium">{member.commitment_score}/100</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {member.date_of_birth
                            ? new Date(member.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {member.last_visit_date
                            ? new Date(member.last_visit_date).toLocaleDateString("en-GB")
                            : "Never"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                          {daysInactive !== null ? `${daysInactive} days` : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentStatusBadgeColor(member.payment_status)}`}>
                            {member.payment_status || "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRiskBadgeColor(member.churn_risk_level)}`}>
                              {member.churn_risk_level}
                            </span>
                            <span className="text-xs text-gray-500">Score: {member.churn_risk_score}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {isAtRisk && member.email && (
                              <button
                                type="button"
                                onClick={() => handleQuickSendEmail(member.id)}
                                disabled={sendingId === member.id}
                                className="rounded-md bg-lime-500 px-2.5 py-1 text-xs font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
                              >
                                {sendingId === member.id ? "…" : "Email"}
                              </button>
                            )}
                            <Link
                              href={`/members/${member.id}?from=members`}
                              className="text-lime-600 hover:text-lime-800"
                            >
                              View →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-sm text-gray-700">
                Showing {(parseInt(page, 10) - 1) * 50 + 1} to{" "}
                {Math.min(parseInt(page, 10) * 50, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const params = buildParamsWithSearch({ page: String(Math.max(1, parseInt(page, 10) - 1)) });
                    router.push(`/members?${params.toString()}`);
                  }}
                  disabled={parseInt(page, 10) <= 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const params = buildParamsWithSearch({ page: String(Math.min(totalPages, parseInt(page, 10) + 1)) });
                    router.push(`/members?${params.toString()}`);
                  }}
                  disabled={parseInt(page, 10) >= totalPages}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
