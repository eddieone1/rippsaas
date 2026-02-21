"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BrandingSection from "./BrandingSection";
import PersonalInfoSection from "./PersonalInfoSection";
import IntegrationsSection from "./IntegrationsSection";
import StudioIntegrationsSection from "./StudioIntegrationsSection";
import SettingsMembersSection from "./SettingsMembersSection";
import MembershipTypesTab from "./MembershipTypesTab";
import StaffSection from "./StaffSection";
import MinimumViableControl from "./MinimumViableControl";
import AutoInterventionsSettingsCard from "./AutoInterventionsSettingsCard";
import SetupChecklist from "./SetupChecklist";
import SettingsNav from "./SettingsNav";
import SettingsToast from "./SettingsToast";

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
  sender_name?: string | null;
  sender_email?: string | null;
  sms_from_number?: string | null;
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
  memberCount: number;
  isOwner: boolean;
}

export default function SettingsContent({
  gym,
  userProfile,
  membershipTypes,
  memberCount,
  isOwner,
}: SettingsContentProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showSuccess = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="shrink-0 lg:w-52">
        <SettingsNav isOwner={isOwner} />
      </aside>
      <main className="min-w-0 flex-1 space-y-8 pb-12">
        <SetupChecklist
          gym={gym}
          membershipTypesCount={membershipTypes.length}
          memberCount={memberCount}
        />

        <section id="branding" className="scroll-mt-24">
          <BrandingSection gym={gym} onSuccess={showSuccess} />
        </section>
        <section id="communications" className="scroll-mt-24">
          <IntegrationsSection gym={gym} onSuccess={showSuccess} />
        </section>
        <section id="auto-interventions" className="scroll-mt-24">
          <AutoInterventionsSettingsCard />
        </section>
        <section id="memberships" className="scroll-mt-24">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Memberships</h2>
            <p className="text-sm text-gray-600 mb-4">
              Plan names and pricing power revenue-at-risk and churn metrics.
            </p>
            <MembershipTypesTab
              membershipTypes={membershipTypes}
              gymId={gym?.id ?? null}
              onUpdate={() => router.refresh()}
              onSuccess={showSuccess}
            />
          </div>
        </section>
        <section id="members" className="scroll-mt-24">
          <SettingsMembersSection />
        </section>
        <section id="studio" className="scroll-mt-24">
          <StudioIntegrationsSection onSuccess={showSuccess} />
        </section>
        {isOwner && (
          <section id="staff" className="scroll-mt-24">
            <StaffSection onSuccess={showSuccess} />
          </section>
        )}
        <section id="personal" className="scroll-mt-24">
          <PersonalInfoSection onSuccess={showSuccess} />
        </section>
        <section id="gym-profile" className="scroll-mt-24">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gym profile & subscription</h2>
            <MinimumViableControl gym={gym} userProfile={userProfile} onSuccess={showSuccess} />
          </div>
        </section>
      </main>
      <SettingsToast
        message={toastMessage ?? ""}
        visible={!!toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}
