import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Rip - Retention Intelligence Platform",
  description: "Terms of service for Rip, the retention intelligence platform for gyms and studios.",
};

export default function TermsPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-white/65">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <div className="mt-12 space-y-8 text-white/80 prose prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using Rip (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="leading-relaxed">
              Rip provides a retention intelligence platform for gyms and studios, including member analytics, at-risk detection, outreach campaigns, and related features. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Your Account and Responsibilities</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information and comply with applicable laws when using the Service. You are responsible for ensuring that your use of member data complies with data protection regulations (e.g. GDPR, CCPA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="leading-relaxed">
              You agree not to use the Service for any unlawful purpose, to transmit harmful or malicious content, to interfere with the Service or other users, or to attempt unauthorised access to our systems or data. We may suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Subscription and Payment</h2>
            <p className="leading-relaxed">
              Paid plans are subject to the pricing and billing terms presented at signup. You agree to pay all fees associated with your subscription. We may change pricing with reasonable notice. The Free Retention Audit is a one-off report service and does not include a software subscription unless you choose a paid plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              The Service, including its software, design, and content, is owned by Rip and protected by intellectual property laws. You may not copy, modify, or create derivative works without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
            <p className="leading-relaxed">
              The Service is provided &quot;as is&quot;. To the maximum extent permitted by law, Rip shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Contact</h2>
            <p className="leading-relaxed">
              For questions about these Terms, please contact us via our{" "}
              <Link href="/support" className="text-[#9EFF00] hover:underline">
                support page
              </Link>
              .
            </p>
          </section>
        </div>

        <p className="mt-12">
          <Link href="/" className="text-sm text-[#9EFF00] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
