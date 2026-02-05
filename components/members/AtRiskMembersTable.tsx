"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";

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

/**
 * Reusable At-Risk Members Table Component
 * 
 * Features:
 * - Sortable columns (commitment score, risk score, last visit, name)
 * - Filterable by risk level
 * - Shows assigned coach
 * - Pagination
 * - Performance optimized
 */
export default function AtRiskMembersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<AtRiskMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // URL state
  const riskLevel = searchParams.get('riskLevel') || 'all';
  const sortBy = searchParams.get('sortBy') || 'commitment_score';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete('page'); // Reset to page 1 when filtering/sorting
    router.push(`/members/at-risk?${params.toString()}`);
  };

  useEffect(() => {
    fetchMembers();
  }, [riskLevel, sortBy, sortOrder, page]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('riskLevel', riskLevel);
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
        return 'bg-blue-100 text-blue-800 border-blue-300';
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
    if (score >= 60) return 'text-blue-600';
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
          No at-risk members
        </h3>
        <p className="text-sm text-gray-600">
          All your active members are showing healthy engagement patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by risk:</label>
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => handleRiskFilter(level)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                riskLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
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
                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      member.churn_risk_level === 'high' ? 'bg-red-50/30' : ''
                    }`}
                  >
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
