import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import CoachInbox from "@/components/coach/CoachInbox";

/**
 * Coach Action Inbox Page
 * 
 * Purpose: Coach accountability
 * 
 * Simple task list - no dashboards, no analytics, just actions.
 * Shows daily actions for assigned members.
 */
export default async function CoachInboxPage() {
  // Only coaches can access
  const { userProfile } = await requireRole("coach");

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Actions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Daily tasks for your assigned members
        </p>
      </div>

      {/* Inbox Component */}
      <CoachInbox />
    </div>
  );
}
