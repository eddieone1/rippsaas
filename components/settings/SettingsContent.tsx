"use client";

import { useRouter } from "next/navigation";
import BrandingSection from "./BrandingSection";
import PersonalInfoSection from "./PersonalInfoSection";
import SettingsMembersSection from "./SettingsMembersSection";
import MembershipTypesTab from "./MembershipTypesTab";
import StaffSection from "./StaffSection";
import MinimumViableControl from "./MinimumViableControl";

interface Gym {
  id: string;
  name: string;
  subscription_status: string;
  logo_url?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface UserProfile {
  full_name: string;
  role: string;
}

interface MembershipType {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number | null;
  billing_frequency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingsContentProps {
  gym: Gym | null;
  userProfile: UserProfile | null;
  membershipTypes: MembershipType[];
  isOwner: boolean;
}

export default function SettingsContent({
  gym,
  userProfile,
  membershipTypes,
  isOwner,
}: SettingsContentProps) {
  const router = useRouter();

  return (
    <div className="space-y-10">
      <BrandingSection gym={gym} />

      <PersonalInfoSection />

      <SettingsMembersSection />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Memberships</h2>
        <MembershipTypesTab
          membershipTypes={membershipTypes}
          gymId={gym?.id ?? null}
          onUpdate={() => router.refresh()}
        />
      </div>

      {isOwner && <StaffSection />}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gym profile & subscription</h2>
        <MinimumViableControl gym={gym} userProfile={userProfile} />
      </div>
    </div>
  );
}
