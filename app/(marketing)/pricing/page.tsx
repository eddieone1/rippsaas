import Link from "next/link";

export default function PricingPage() {
  return (
    <>
      <section className="bg-gray-50 px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple pricing per location
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Value based pricing tied to retained revenue. No hidden fees, no long term contracts.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-16 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Starter */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Starter</h2>
              <p className="mt-1 text-sm text-gray-500">For single location gyms</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">£99</span>
                <span className="text-gray-500">/location/month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                <li>Up to 200 active members</li>
                <li>Churn risk scoring</li>
                <li>Email campaigns</li>
                <li>Intervention effectiveness tracking</li>
                <li>Standard support</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-md border border-gray-300 bg-white py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Growth */}
            <div className="relative flex flex-col rounded-2xl border-2 border-lime-500 bg-white p-8 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime-500 px-3 py-0.5 text-xs font-medium text-gray-900">
                Most popular
              </div>
              <h2 className="text-xl font-bold text-gray-900">Growth</h2>
              <p className="mt-1 text-sm text-gray-500">For growing and multi location</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">£199</span>
                <span className="text-gray-500">/location/month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                <li>Up to 500 active members</li>
                <li>Advanced churn scoring</li>
                <li>Email + SMS campaigns</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>Multi location dashboard</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-md bg-lime-500 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-lime-400 transition-colors"
              >
                Get a demo
              </Link>
            </div>

            {/* Scale */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Scale</h2>
              <p className="mt-1 text-sm text-gray-500">For larger operations</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">Custom</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                <li>500+ active members</li>
                <li>Unlimited campaigns</li>
                <li>Dedicated retention strategist</li>
                <li>Custom integrations</li>
                <li>White label options</li>
                <li>API access</li>
                <li>SLA guarantees</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-md border border-gray-300 bg-white py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Contact sales
              </Link>
            </div>
          </div>

          <div className="mt-16 rounded-xl border border-gray-200 bg-gray-50 p-8">
            <h3 className="text-lg font-semibold text-gray-900">Why Rip pays for itself</h3>
            <p className="mt-3 text-gray-600">
              For a typical UK gym with 300 members at £40/month: a 5% monthly churn means 15 members lost (£7,200/year).
              With Rip, a 2–3% reduction in churn can save 6+ members, worth £2,880+ per year per location.
              Most plans pay for themselves by saving just 2–3 members from churning each month.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              No setup fees. Month to month. 14 day trial available.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-md bg-lime-500 px-6 py-3 text-base font-medium text-gray-900 hover:bg-lime-400 transition-colors"
            >
              Get a demo
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
