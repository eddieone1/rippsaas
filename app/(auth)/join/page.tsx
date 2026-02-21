import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinOrganizationForm from "@/components/auth/JoinOrganizationForm";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/join" + (searchParams.token ? `&token=${searchParams.token}` : ""));
  }

  // Check if user already has a gym
  const { data: userProfile } = await supabase
    .from("users")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (userProfile?.gym_id) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Join Organisation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accept an invitation to join an organisation
          </p>
        </div>
        <JoinOrganizationForm token={searchParams.token} />
      </div>
    </div>
  );
}
