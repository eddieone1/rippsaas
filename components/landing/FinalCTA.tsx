import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Ready to stop losing members and start keeping them?
        </h2>
        <p className="mt-4 text-lg text-white/65 max-w-xl mx-auto">
          Join gyms and studios that use Rip to see which messages actually bring members back.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex justify-center rounded-lg bg-[#9EFF00] px-6 py-3 text-base font-semibold text-black hover:opacity-90 transition-opacity"
          >
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-white/[0.08] bg-transparent px-6 py-3 text-base font-medium text-white hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
