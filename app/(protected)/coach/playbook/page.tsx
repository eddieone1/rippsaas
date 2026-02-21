import { redirect } from "next/navigation";

/**
 * CHAMP Playbook has been consolidated into Coach Accountability.
 * Redirect to the "Today" tab.
 */
export default function CoachPlaybookPage() {
  redirect("/coach-accountability?view=today");
}
