import { requireAction } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import SettingsContent from "@/components/settings/SettingsContent";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userProfile, gymId } = await requireAction("manage_settings");

  const supabase = await createClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", gymId)
    .single();

  const { data: membershipTypes } = gymId
    ? await supabase
        .from("membership_types")
        .select("*")
        .eq("gym_id", gymId)
        .order("name")
    : { data: [] };

  const isOwner = userProfile?.role === "owner";

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Business branding, theme, personal info, memberships and staff
        </p>
      </div>

      <SettingsContent
        gym={gym}
        userProfile={userProfile}
        membershipTypes={membershipTypes ?? []}
        isOwner={!!isOwner}
      />
    </div>
  );
}
