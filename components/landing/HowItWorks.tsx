import Link from "next/link";

const STEPS = [
  {
    step: 1,
    title: "Sign up",
    description: "Create your account and add your gym details. No credit card required.",
  },
  {
    step: 2,
    title: "Upload members",
    description: "Import from Mindbody, Glofox, TeamUp, or upload a CSV. We'll score risk automatically.",
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
                  href="/signup"
                  className="mt-6 inline-block rounded-lg bg-[#9EFF00] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Start free trial
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
