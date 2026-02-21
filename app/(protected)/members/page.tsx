import { redirect } from "next/navigation";
import Link from "next/link";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import MembersPageClient from "@/components/members/MembersPageClient";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; risk?: string; search?: string; birthdays?: string; page?: string }> | { tab?: string; status?: string; risk?: string; search?: string; birthdays?: string; page?: string };
}) {
  const { gymId, userProfile } = await getGymContext();

  if (!userProfile) {
    redirect("/onboarding/gym-info");
  }

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  const resolved = await Promise.resolve(searchParams);
  const tab = resolved.tab || "at-risk";
  const statusFilter = resolved.status || "all";
  const riskFilter = resolved.risk || "all";
  const searchQuery = resolved.search || "";
  const birthdaysFilter = resolved.birthdays || "";
  const page = resolved.page || "1";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your members. Use Need attention to focus on those who need outreach.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/plays"
            className="inline-flex items-center justify-center rounded-md bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
          >
            Run a play
          </Link>
          <Link
            href="/members/upload"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
          >
            Upload / update member data
          </Link>
        </div>
      </div>

      <MembersPageClient
        gymId={gymId}
        initialTab={tab}
        initialStatus={statusFilter}
        initialRisk={riskFilter}
        initialSearch={searchQuery}
        initialBirthdays={birthdaysFilter}
        initialPage={page}
      />
    </div>
  );
}
