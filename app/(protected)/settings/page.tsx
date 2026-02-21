import { requireAction } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import SettingsContent from "@/components/settings/SettingsContent";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userProfile, gymId } = await requireAction("manage_settings");

  const supabase = await createClient();
  // Exclude integration secrets so they are never sent to the client
  const { data: gym } = await supabase
    .from("gyms")
    .select("id, name, owner_email, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, created_at, updated_at, sender_name, sender_email, sms_from_number, logo_url, brand_primary_color, brand_secondary_color, address_line1, address_line2, city, postcode, country, latitude, longitude")
    .eq("id", gymId)
    .single();

  const { data: membershipTypes } = gymId
    ? await supabase
        .from("membership_types")
        .select("*")
        .eq("gym_id", gymId)
        .order("name")
    : { data: [] };

  let memberCount = 0;
  if (gymId) {
    const { count } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gymId);
    memberCount = count ?? 0;
  }

  const isOwner = userProfile?.role === "owner";

  return (
    <div className="max-w-4xl px-4 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure branding, communications, and retention tools
        </p>
      </div>

      <SettingsContent
        gym={gym}
        userProfile={userProfile}
        membershipTypes={membershipTypes ?? []}
        memberCount={memberCount}
        isOwner={!!isOwner}
      />
    </div>
  );
}
