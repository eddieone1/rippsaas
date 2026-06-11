import Link from "next/link";
import PricingCards from "@/components/pricing/PricingCards";
import { AUDIT_SECTION_COPY, PRICING_HERO } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <>
      <section className="px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {PRICING_HERO.title}
          </h1>
          <p className="mt-4 text-lg text-white/65">{PRICING_HERO.subtitle}</p>
          <p className="mt-3 text-base font-medium text-[#9EFF00]">
            {PRICING_HERO.positioning}
          </p>
        </div>
      </section>

      <section className="px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <PricingCards />

          <div className="mt-16 rounded-xl border border-white/[0.08] bg-rip-bg-2 p-8">
            <h3 className="text-lg font-semibold text-white">Why Rip pays for itself</h3>
            <p className="mt-3 text-white/65">
              For a typical UK gym with 300 members at £40/month: a 5% monthly churn means
              15 members lost (£7,200/year). Spotting at-risk members early and acting before
              they leave can save thousands per year — often by keeping just 2–3 members per
              month.
            </p>
          </div>

          <div className="mt-12 rounded-xl border border-dashed border-[#9EFF00]/30 bg-[#9EFF00]/5 p-8 text-center">
            <h3 className="text-lg font-semibold text-white">Not ready to subscribe yet?</h3>
            <p className="mt-3 text-sm text-white/65 max-w-2xl mx-auto">{AUDIT_SECTION_COPY}</p>
            <Link
              href="/audit"
              className="mt-6 inline-flex rounded-lg bg-[#9EFF00] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Get Free Audit
            </Link>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/audit"
              className="rounded-lg bg-[#9EFF00] px-6 py-3 text-base font-semibold text-black hover:opacity-90 transition-opacity"
            >
              See At-Risk Members
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/[0.08] bg-transparent px-6 py-3 text-base font-medium text-white hover:border-white/20 hover:bg-white/5 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
