import { redirect } from "next/navigation";
import Link from "next/link";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import MembersListSimplified from "@/components/members/MembersListSimplified";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { status?: string; risk?: string; search?: string };
}) {
  const { gymId, userProfile } = await getGymContext();

  if (!userProfile) {
    redirect("/onboarding/gym-info");
  }

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  const statusFilter = searchParams.status || "all"; // all, active, inactive
  const riskFilter = searchParams.risk || "all"; // all, high, medium, low, none
  const searchQuery = searchParams.search || "";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Members</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your members
          </p>
        </div>
        <Link
          href="/members/upload"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Upload / update member data
        </Link>
      </div>

      <MembersListSimplified
        gymId={gymId}
        statusFilter={statusFilter}
        riskFilter={riskFilter}
        searchQuery={searchQuery}
      />
    </div>
  );
}
