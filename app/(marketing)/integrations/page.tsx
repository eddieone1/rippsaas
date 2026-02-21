import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="border-t border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Integrate forever, replace never
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Rip is a retention layer that works alongside your existing gym management software. We enhance what you already have, not replace it.
          </p>
        </div>
      </section>

      {/* Core Message */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border-2 border-lime-500 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              We don't manage gyms. We manage member commitment.
            </h2>
            <p className="text-gray-600 mb-4">
              Your existing software handles bookings, payments, and operations brilliantly. Rip sits on top, adding retention intelligence without disrupting your workflow.
            </p>
            <p className="text-gray-600">
              <strong className="text-gray-900">Strategic choice:</strong> Integrate forever, replace never. Rip enhances existing systems rather than replacing them.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How Rip integrates with your existing systems
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-lime-100 p-2">
                  <svg className="h-6 w-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">CSV Import</h3>
              </div>
              <p className="text-gray-600">
                Start immediately by uploading your member list via CSV. No API setup required. Export from Mindbody, Glofox, or any system and import directly into Rip.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-lime-100 p-2">
                  <svg className="h-6 w-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">API Integration</h3>
              </div>
              <p className="text-gray-600">
                Native sync with Mindbody and Glofox: add your credentials in Settings and we pull members, visits, memberships, and payments automatically. Also works with any platform that exposes an API.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-lime-100 p-2">
                  <svg className="h-6 w-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Zapier & Make</h3>
              </div>
              <p className="text-gray-600">
                Connect Rip to hundreds of apps using Zapier or Make (formerly Integromat). No coding required. Set up automated workflows between your systems.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-lime-100 p-2">
                  <svg className="h-6 w-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Disruption</h3>
              </div>
              <p className="text-gray-900">
                Keep using Mindbody, Glofox, ABC Fitness, or whatever system you already have. Rip adds retention intelligence on top, without changing your operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Native integrations */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Native integrations
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Connect your gym software and outreach channels in Settings. Sync member data and send retention plays from your own accounts.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Studio software (member data sync)</h3>
          <p className="text-sm text-gray-600 mb-6">
            Add your API credentials in Settings to sync members, memberships, visits, and payments automatically. Data is normalised into one view for retention insights and plays.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border-2 border-lime-500 bg-white p-6 text-center">
              <span className="inline-block rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-800 mb-2">Available</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mindbody</h3>
              <p className="text-sm text-gray-600">Sync clients, visits, contracts, and sales. Connect in Settings with your API key, Site ID, and access token.</p>
            </div>
            <div className="rounded-xl border-2 border-lime-500 bg-white p-6 text-center">
              <span className="inline-block rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-800 mb-2">Available</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Glofox</h3>
              <p className="text-sm text-gray-600">Sync members, memberships, attendances, and payments. Add your access token (and optional base URL) in Settings.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 mb-2">Coming soon</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ABC Fitness</h3>
              <p className="text-sm text-gray-600">Enterprise gym chains. We're building direct integration.</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-12 mb-4">Email & SMS (outreach)</h3>
          <p className="text-sm text-gray-600 mb-6">
            Use your own Resend and Twilio accounts to send retention emails and SMS from your domain and number. Optional; leave blank to use the app default.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resend</h3>
              <p className="text-sm text-gray-600">Send outreach emails from your verified domain. Add your API key and sender identity in Settings.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Twilio</h3>
              <p className="text-sm text-gray-600">Send SMS from your own number. Add Account SID, Auth Token, and from number in Settings.</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need a different integration? <Link href="/signup" className="text-lime-600 hover:text-lime-500 font-medium">Contact us</Link> to discuss custom integration options.
            </p>
          </div>
        </div>
      </section>

      {/* Why Integration-First */}
      <section className="border-t border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Why integration-first matters
          </h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-lime-500 p-2">
                  <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflow disruption</h3>
                <p className="text-gray-600">
                  Your team keeps using the systems they know. No retraining, no migration, no downtime. Rip works in the background, adding retention intelligence without changing how you operate.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-lime-500 p-2">
                  <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Leverage existing data</h3>
                <p className="text-gray-600">
                  You already have member data, visit history, and payment information. Rip uses what you've got, adding retention scoring and intervention tracking on top.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-lime-500 p-2">
                  <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lower switching costs</h3>
                <p className="text-gray-600">
                  No need to migrate everything to a new platform. Start with CSV import, add API integration when ready. Your existing systems stay exactly as they are.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-lime-500 p-2">
                  <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Best of both worlds</h3>
                <p className="text-gray-600">
                  Keep the operations features you love from your current software. Add retention intelligence from Rip. Get the best of both without compromise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Ready to add retention intelligence to your existing systems?
          </h2>
          <p className="mt-4 text-gray-600">
            Start with CSV import today. Add API integration when you're ready. No disruption, no migration, just retention intelligence on top of what you already have.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-md bg-lime-500 px-6 py-3 text-base font-medium text-gray-900 hover:bg-lime-400 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
