/**
 * Onboarding funnel analytics.
 * Wire these to PostHog, Mixpanel, or your analytics provider.
 */
export type OnboardingEvent =
  | "onboarding_welcome_viewed"
  | "onboarding_welcome_skipped"
  | "onboarding_gym_info_started"
  | "onboarding_gym_info_completed"
  | "onboarding_payment_started"
  | "onboarding_payment_completed"
  | "onboarding_upload_viewed"
  | "onboarding_upload_completed"
  | "onboarding_upload_skipped"
  | "onboarding_tour_completed"
  | "onboarding_tour_skipped";

export function trackOnboardingEvent(event: OnboardingEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  // Dispatch custom event for analytics providers (PostHog, Mixpanel, etc.)
  window.dispatchEvent(
    new CustomEvent("onboarding_event", {
      detail: { event, properties: properties ?? {}, timestamp: Date.now() },
    })
  );

  // Optional: uncomment and configure your analytics provider
  // if (typeof window.posthog !== "undefined") {
  //   window.posthog.capture(event, properties);
  // }
}
