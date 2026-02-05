import { requireAuth } from "@/lib/auth/guards";
import ChampPlaybook from "@/components/coach/ChampPlaybook";

/**
 * Coach Action Playbook (CHAMP) Page
 *
 * Purpose: Daily execution engine for coaches.
 * Fast, opinionated, action-oriented. No analytics clutter. No configuration UI.
 *
 * - Large action cards (Connect, Help, Activate, Monitor, Praise)
 * - Color-coded, clear verbs
 * - Assigned Actions for Today sidebar
 * - Urgent Action Needed section
 */
export default async function CoachPlaybookPage() {
  await requireAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CHAMP Playbook</h1>
        <p className="mt-2 text-sm text-gray-600">
          Connect · Help · Activate · Monitor · Praise — your daily actions
        </p>
      </div>

      <ChampPlaybook />
    </div>
  );
}
