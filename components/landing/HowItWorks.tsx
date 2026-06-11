import Link from "next/link";

const STEPS = [
  {
    step: 1,
    title: "Get your free audit",
    description: "Send your member data — no card required. We'll show you who's at risk and why.",
  },
  {
    step: 2,
    title: "Choose a plan",
    description: "When you're ready, subscribe to track at-risk members and run retention actions.",
  },
  {
    step: 3,
    title: "See what works",
    description: "Run campaigns, track responses, and prove which messages bring members back.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          How it works
        </h2>
        <p className="mt-3 text-center text-lg text-white/65 max-w-2xl mx-auto">
          Three steps to retention intelligence.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="relative rounded-xl border border-white/[0.08] bg-rip-bg-2 p-6 text-center"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#9EFF00]/20 text-[#9EFF00] font-bold">
                {item.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-white/70">{item.description}</p>
              {item.step === 3 && (
                <Link
                  href="/audit"
                  className="mt-6 inline-block rounded-lg bg-[#9EFF00] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Get Free Audit
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
