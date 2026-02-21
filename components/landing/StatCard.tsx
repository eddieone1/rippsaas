import Link from "next/link";

export default function StatCard() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Run your retention with confidence.
        </h2>
        <div className="mt-10 mx-auto max-w-2xl rounded-xl border border-white/[0.08] bg-rip-bg-2 p-8 shadow-xl sm:p-10">
          <p className="text-center text-xl text-white/90 sm:text-2xl">
            The average gym loses{" "}
            <span className="font-bold text-[#9EFF00]">30–50%</span> of its members every year.
          </p>
          <p className="mt-3 text-center text-white/65">Most gyms don&apos;t know why.</p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-[#9EFF00] px-6 py-3 text-base font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
