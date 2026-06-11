import Link from "next/link";
import { PLANS, PRICING_FOOTNOTE } from "@/lib/pricing";

function FeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-[#9EFF00]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingCards() {
  const audit = PLANS.free_audit;
  const starter = PLANS.starter_49;
  const growth = PLANS.growth_79;

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Free Retention Audit — visually distinct lead magnet */}
        <div className="flex flex-col rounded-2xl border border-dashed border-[#9EFF00]/40 bg-[#9EFF00]/5 p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9EFF00]">
            Start here
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{audit.name}</h2>
          <p className="mt-1 text-sm text-white/55">Best for: {audit.bestFor}</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">{audit.priceLabel}</span>
          </div>
          <p className="mt-4 text-sm text-white/65">{audit.description}</p>
          <FeatureList features={audit.features} />
          <Link
            href={audit.ctaHref}
            className="mt-8 block w-full rounded-lg border border-[#9EFF00]/50 bg-transparent py-2.5 text-center text-sm font-semibold text-[#9EFF00] hover:bg-[#9EFF00]/10 transition-colors"
          >
            {audit.cta}
          </Link>
        </div>

        {/* Starter */}
        <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-rip-bg-2 p-8">
          <h2 className="text-xl font-bold text-white">{starter.name}</h2>
          <p className="mt-1 text-sm text-white/55">Best for: {starter.bestFor}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-1 gap-y-0">
            <span className="text-4xl font-bold text-white">{starter.priceLabel}</span>
            <span className="text-sm text-white/55">{starter.priceSuffix}</span>
          </div>
          {starter.memberLimit && (
            <p className="mt-2 text-xs text-white/45">{starter.memberLimit}</p>
          )}
          {starter.locationLimit && (
            <p className="text-xs text-white/45">{starter.locationLimit}</p>
          )}
          <p className="mt-4 text-sm text-white/65">{starter.description}</p>
          <FeatureList features={starter.features} />
          <Link
            href={starter.ctaHref}
            className="mt-8 block w-full rounded-lg border border-white/20 bg-white/5 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            {starter.cta}
          </Link>
        </div>

        {/* Growth */}
        <div className="flex flex-col rounded-2xl border-2 border-[#9EFF00]/60 bg-rip-bg-2 p-8 shadow-lg shadow-[#9EFF00]/5">
          <h2 className="text-xl font-bold text-white">{growth.name}</h2>
          <p className="mt-1 text-sm text-white/55">Best for: {growth.bestFor}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-1 gap-y-0">
            <span className="text-4xl font-bold text-white">{growth.priceLabel}</span>
            <span className="text-sm text-white/55">{growth.priceSuffix}</span>
          </div>
          <p className="mt-2 text-xs text-white/45">
            Priced per location — not a flat £79 for your whole group
          </p>
          <p className="mt-4 text-sm text-white/65">{growth.description}</p>
          <FeatureList features={growth.features} />
          <Link
            href={growth.ctaHref}
            className="mt-8 block w-full rounded-lg bg-[#9EFF00] py-2.5 text-center text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            {growth.cta}
          </Link>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-white/50 max-w-3xl mx-auto">
        {PRICING_FOOTNOTE}
      </p>
    </div>
  );
}
