"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CSVUploadForm from "@/components/members/CSVUploadForm";
import { trackOnboardingEvent } from "@/lib/analytics";

export default function OnboardingUploadClient() {
  const router = useRouter();

  useEffect(() => {
    trackOnboardingEvent("onboarding_upload_viewed");
  }, []);

  const handleSkip = () => {
    trackOnboardingEvent("onboarding_upload_skipped");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/80">
          Required columns: first_name, last_name, email, date_of_birth, status.
          Optional: visits, joined_date, address. Use YYYY-MM-DD for dates.
        </p>
      </div>
      <CSVUploadForm
        onSuccess={() => trackOnboardingEvent("onboarding_upload_completed")}
      />
      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleSkip}
          className="block w-full text-center text-sm text-white/60 hover:text-white/90 transition-colors py-2"
        >
          Skip for now — I&apos;ll upload later
        </button>
      </div>
    </div>
  );
}
