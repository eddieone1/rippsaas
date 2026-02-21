import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMembershipStatus, getMembershipStatusBadgeColor } from "@/lib/membership-status";
import { differenceInDays, parseISO } from "date-fns";
import MemberActions from "./MemberActions";
import MembershipTypeSelector from "./MembershipTypeSelector";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  joined_date: string;
  last_visit_date: string | null;
  status: string;
  churn_risk_score: number;
  churn_risk_level: string;
  membership_type_id?: string | null;
}

interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  billing_frequency: string | null;
}

export default async function MemberDetail({ 
  member,
  membershipTypes = [],
}: { 
  member: Member;
  membershipTypes?: MembershipType[];
}) {
  const supabase = await createClient();

  const daysSinceLastVisit = member.last_visit_date
    ? differenceInDays(new Date(), parseISO(member.last_visit_date))
    : null;

  // Get campaign history for this member
  const { data: campaignSends } = await supabase
    .from("campaign_sends")
    .select(
      `
      *,
      campaigns (
        name,
        trigger_days
      )
    `
    )
    .eq("member_id", member.id)
    .order("sent_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Member Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Member Information</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.first_name} {member.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{member.phone || "-"}</dd>
              </div>
              {(member as any).age !== null && (member as any).age !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-sm text-gray-900">{(member as any).age} years old</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(member.joined_date).toLocaleDateString('en-GB')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Visit</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {member.last_visit_date
                    ? new Date(member.last_visit_date).toLocaleDateString('en-GB')
                    : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Days Since Last Visit</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {daysSinceLastVisit !== null ? `${daysSinceLastVisit} days` : "-"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Billing Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {((member as any).billing_address_line1 || (member as any).billing_city || (member as any).billing_postcode) ? (
                    <>
                      {(member as any).billing_address_line1 && <div>{(member as any).billing_address_line1}</div>}
                      {(member as any).billing_address_line2 && <div>{(member as any).billing_address_line2}</div>}
                      {((member as any).billing_city || (member as any).billing_postcode) && (
                        <div>
                          {(member as any).billing_city}
                          {(member as any).billing_city && (member as any).billing_postcode && ", "}
                          {(member as any).billing_postcode}
                        </div>
                      )}
                      {(member as any).billing_country && <div>{(member as any).billing_country}</div>}
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Membership Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getMembershipStatusBadgeColor(member.status)}`}>
                    {formatMembershipStatus(member.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Churn Risk</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      member.churn_risk_level === "high"
                        ? "bg-red-100 text-red-800"
                        : member.churn_risk_level === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : member.churn_risk_level === "low"
                        ? "bg-lime-100 text-lime-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {member.churn_risk_level} ({member.churn_risk_score}/100)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Membership Type</dt>
                <dd className="mt-1">
                  <MembershipTypeSelector 
                    memberId={member.id} 
                    currentMembershipTypeId={member.membership_type_id || null}
                    membershipTypes={membershipTypes}
                  />
                </dd>
              </div>
            </dl>
          </div>

          {/* Outreach History */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Outreach History</h2>
            {campaignSends && campaignSends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Campaign
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Sent Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Visited again
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {campaignSends.map((send: any) => (
                      <tr key={send.id}>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                          {send.campaigns?.name || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                          {new Date(send.sent_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm">
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                            {send.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm">
                          {send.member_re_engaged ? (
                            <span className="text-green-600">✓ Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No outreach sent to this member yet.</p>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div>
          <MemberActions member={{ id: member.id, firstName: member.first_name, lastName: member.last_name, email: member.email }} />
        </div>
      </div>
    </div>
  );
}
