"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import RunPlayOnMembersModal from "./RunPlayOnMembersModal";
import AssignCoachModal from "./AssignCoachModal";

interface AtRiskMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  last_visit_date: string | null;
  churn_risk_score: number;
  churn_risk_level: string;
  commitment_score: number | null;
  last_contacted_at: string | null;
  coach: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AtRiskMembersResponse {
  members: AtRiskMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AtRiskMembersTableProps {
  gymId?: string;
}

/**
 * Reusable At-Risk Members Table Component
 * 
 * Features:
 * - Bulk selection + Run play / Assign coach
 * - Sortable columns (commitment score, risk score, last visit, last contacted, name)
 * - Filterable by risk level and coach assignment
 * - Run play per row
 * - Pagination
 */
export default function AtRiskMembersTable({ gymId }: AtRiskMembersTableProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isEmbedded = pathname === "/members";
  
  const [data, setData] = useState<AtRiskMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRunModal, setShowRunModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // URL state
  const riskLevel = searchParams.get('riskLevel') || 'all';
  const assigned = searchParams.get('assigned') || 'all';
  const sortBy = searchParams.get('sortBy') || 'commitment_score';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (isEmbedded) params.set("tab", "at-risk");
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!("page" in updates)) params.delete("page");
    const base = isEmbedded ? "/members" : "/members/at-risk";
    router.push(`${base}?${params.toString()}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.members) return;
    if (selectedIds.size === data.members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.members.map((m) => m.id)));
    }
  };

  const getDaysSinceContact = (lastContactedAt: string | null): number | null => {
    if (!lastContactedAt) return null;
    try {
      return differenceInDays(new Date(), parseISO(lastContactedAt));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [riskLevel, assigned, sortBy, sortOrder, page]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('riskLevel', riskLevel);
      if (assigned !== 'all') params.append('assigned', assigned);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/members/at-risk?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to load members');
        return;
      }

      setData(result);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    updateURL({ sortBy: column, sortOrder: newSortOrder });
  };

  const handleRiskFilter = (level: string) => {
    updateURL({ riskLevel: level });
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-lime-100 text-lime-800 border-lime-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCommitmentLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'High';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const getCommitmentColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-lime-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDaysInactive = (lastVisitDate: string | null): number | null => {
    if (!lastVisitDate) return null;
    try {
      return differenceInDays(new Date(), parseISO(lastVisitDate));
    } catch {
      return null;
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
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

  if (!data || data.members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No one needs attention
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Well done – all your active members are showing healthy engagement patterns.
        </p>
        <Link href="/plays" className="text-sm font-medium text-lime-600 hover:text-lime-800">
          Run a play →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && gymId && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-lime-300 bg-lime-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-900">
            {selectedIds.size} member{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRunModal(true)}
              className="rounded-md bg-lime-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-lime-700"
            >
              Run play
            </button>
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Assign coach
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {showRunModal && gymId && (
        <RunPlayOnMembersModal
          gymId={gymId}
          memberIds={Array.from(selectedIds)}
          memberCount={selectedIds.size}
          onClose={() => setShowRunModal(false)}
          onSuccess={() => {
            setSelectedIds(new Set());
            fetchMembers();
          }}
        />
      )}

      {showAssignModal && (
        <AssignCoachModal
          memberIds={Array.from(selectedIds)}
          memberCount={selectedIds.size}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setSelectedIds(new Set());
            fetchMembers();
          }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Risk:</label>
          <div className="flex gap-1">
            {['all', 'high', 'medium', 'low'].map((level) => (
              <button
                key={level}
                onClick={() => handleRiskFilter(level)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  riskLevel === level
                    ? 'bg-lime-500 text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Coach:</label>
          <div className="flex gap-1">
            {(['all', 'unassigned', 'assigned'] as const).map((a) => (
              <button
                key={a}
                onClick={() => updateURL({ assigned: a })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  assigned === a
                    ? 'bg-lime-500 text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a === 'all' ? 'All' : a === 'unassigned' ? 'Unassigned' : 'Assigned'}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto text-sm text-gray-600">
          {data.total} member{data.total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {gymId && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={data.members.length > 0 && selectedIds.size === data.members.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Name
                    <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <button
                    onClick={() => handleSort('commitment_score')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Commitment Score
                    <SortIcon column="commitment_score" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <button
                    onClick={() => handleSort('churn_risk_score')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Risk Level
                    <SortIcon column="churn_risk_score" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <button
                    onClick={() => handleSort('last_visit_date')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Last Visit
                    <SortIcon column="last_visit_date" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Last Contacted
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Assigned Coach
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.members.map((member) => {
                const daysInactive = getDaysInactive(member.last_visit_date);
                const daysSinceContact = getDaysSinceContact(member.last_contacted_at ?? null);
                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      member.churn_risk_level === 'high' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    {gymId && (
                      <td className="whitespace-nowrap px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(member.id)}
                          onChange={() => toggleSelect(member.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                      {member.email && (
                        <div className="text-xs text-gray-500">{member.email}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className={`text-sm font-semibold ${getCommitmentColor(member.commitment_score)}`}>
                        {member.commitment_score !== null ? `${member.commitment_score}/100` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCommitmentLabel(member.commitment_score)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeColor(
                          member.churn_risk_level
                        )}`}
                      >
                        {member.churn_risk_level.toUpperCase()}
                      </span>
                      <div className="mt-1 text-xs text-gray-500">
                        Score: {member.churn_risk_score}/100
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {member.last_visit_date ? (
                        <>
                          <div>{new Date(member.last_visit_date).toLocaleDateString('en-GB')}</div>
                          {daysInactive !== null && (
                            <div className="text-xs text-gray-500">
                              {daysInactive} day{daysInactive !== 1 ? 's' : ''} ago
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {daysSinceContact !== null ? (
                        <span>{daysSinceContact} day{daysSinceContact !== 1 ? "s" : ""} ago</span>
                      ) : (
                        <span className="text-amber-600 font-medium">Never</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {member.coach ? (
                        <div>
                          <div className="font-medium">{member.coach.name}</div>
                          <div className="text-xs text-gray-500">{member.coach.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {gymId && (member.email || member.phone) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds(new Set([member.id]));
                              setShowRunModal(true);
                            }}
                            className="rounded-md bg-lime-500 px-2.5 py-1 text-xs font-medium text-gray-900 hover:bg-lime-400"
                          >
                            Run play
                          </button>
                        )}
                        <Link
                          href={`/members/${member.id}?from=at-risk`}
                          className="text-lime-600 hover:text-lime-900"
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

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} members
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateURL({ page: (page - 1).toString() })}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => updateURL({ page: (page + 1).toString() })}
                  disabled={page >= data.totalPages}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
