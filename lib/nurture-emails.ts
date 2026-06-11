const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://rip.app";

export function auditDay1Email(params: {
  contactName: string;
  gymName: string;
}): { subject: string; body: string } {
  const auditUrl = `${appUrl()}/audit`;
  const pricingUrl = `${appUrl()}/pricing`;

  return {
    subject: `Your free retention audit — ${params.gymName}`,
    body: `Hi ${params.contactName},

Thanks for requesting a free retention audit for ${params.gymName}.

We're reviewing your details and will send your at-risk member report within 2 business days.

If you haven't uploaded a member CSV yet, you can reply to this email or visit:
${auditUrl}

When you're ready to track at-risk members yourself, plans start at £49/month per location:
${pricingUrl}

Best,
The Rip team`,
  };
}

export function subscribeDay3Email(params: {
  gymName: string;
}): { subject: string; body: string } {
  const settingsUrl = `${appUrl()}/settings#subscription`;
  const auditUrl = `${appUrl()}/audit`;

  return {
    subject: `Ready to track at-risk members? — ${params.gymName}`,
    body: `Hi,

You set up ${params.gymName} on Rip a few days ago. Ready to start tracking which members are at risk?

Starter is £49/month per location — churn risk scoring, at-risk lists, CSV uploads, and email campaign tracking.

Choose a plan:
${settingsUrl}

Not ready yet? Request a free retention audit (no card required):
${auditUrl}

Best,
The Rip team`,
  };
}

export function subscribeDay7Email(params: {
  gymName: string;
}): { subject: string; body: string } {
  const settingsUrl = `${appUrl()}/settings#subscription`;
  const pricingUrl = `${appUrl()}/pricing`;

  return {
    subject: `See which members are at risk before paying — ${params.gymName}`,
    body: `Hi,

A quick reminder: Rip helps gyms like ${params.gymName} spot at-risk members early and prove which retention actions work.

Starter — £49/month per location
For single-location gyms (up to ~250–300 active members).

Growth — £79/month per location
For larger or multi-location gyms needing SMS, segmentation, and priority support.

View plans and subscribe:
${settingsUrl}

Or compare features:
${pricingUrl}

Best,
The Rip team`,
  };
}

/** Whole days elapsed since a timestamp (UTC calendar-day style). */
export function wholeDaysSince(isoDate: string, now = new Date()): number {
  const start = new Date(isoDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((now.getTime() - start.getTime()) / msPerDay);
}
