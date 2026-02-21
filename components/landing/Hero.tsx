import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-20 lg:pb-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[52px] lg:leading-[1.1]">
              Stop Losing Members.{" "}
              <span className="text-[#9EFF00]">Start Predicting Churn.</span>
            </h1>
            <p className="mt-6 text-lg text-white/65 max-w-xl">
              Identify at-risk members, automate outreach, and prove which messages bring them back — the only platform that shows you what works.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="inline-flex justify-center rounded-lg bg-[#9EFF00] px-6 py-3 text-base font-semibold text-black hover:opacity-90 transition-opacity"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex justify-center rounded-lg border border-white/[0.08] bg-transparent px-6 py-3 text-base font-medium text-white hover:border-white/20 hover:bg-white/5 transition-colors"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/50">
              No credit card required • 14-day trial • Works with your gym software
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/45">
              <span>Mindbody</span>
              <span>Glofox</span>
              <span>TeamUp</span>
              <span>CSV upload</span>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 bg-[#9EFF00]/10 blur-3xl rounded-full scale-150 translate-x-1/4 translate-y-1/4 pointer-events-none" />
            <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-rip-bg-2 shadow-2xl overflow-hidden ring-1 ring-black/20">
              {/* Window title bar */}
              <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-xs text-white/50 font-medium">Member profile — Rip</span>
                </div>
                <div className="w-10" aria-hidden />
              </div>
              <div className="relative overflow-hidden rounded-b-2xl">
                <img
                  src="/rip member profile.png"
                  alt="Rip member profile dashboard"
                  className="w-full h-auto object-cover object-top block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
