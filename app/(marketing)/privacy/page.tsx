import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Rip - Retention Intelligence Platform",
  description: "Privacy policy for Rip, the retention intelligence platform for gyms and studios.",
};

export default function PrivacyPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-white/65">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <div className="mt-12 space-y-8 text-white/80 prose prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              Rip (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our retention intelligence platform for gyms and studios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide directly (such as account details, gym information, and member data), information from your use of our services (such as usage data and analytics), and information from third-party integrations (such as Mindbody and Glofox) when you connect them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use your information to provide, maintain, and improve our services; to process transactions; to send you relevant communications; to comply with legal obligations; and to protect the security of our platform and users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p className="leading-relaxed">
              We do not sell your personal information. We may share data with service providers who assist in operating our platform (e.g. hosting, email delivery), when required by law, or with your consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="leading-relaxed">
              Depending on your location, you may have rights to access, correct, delete, or port your personal data, or to object to or restrict certain processing. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Contact Us</h2>
            <p className="leading-relaxed">
              For questions about this Privacy Policy or our data practices, please contact us via our{" "}
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
