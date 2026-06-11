import Link from "next/link";
import AuditRequestForm from "@/components/audit/AuditRequestForm";
import { AUDIT_SECTION_COPY, PRICING_HERO } from "@/lib/pricing";

export default function AuditPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9EFF00]">
            Free Retention Audit
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {PRICING_HERO.positioning}
          </h1>
          <p className="mt-4 text-lg text-white/65">{AUDIT_SECTION_COPY}</p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-rip-bg-2 p-8 shadow-xl">
          <AuditRequestForm />
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          Prefer a full subscription?{" "}
          <Link href="/pricing" className="text-[#9EFF00] hover:underline">
            View pricing
          </Link>
          {" · "}
          <Link href="/signup" className="text-[#9EFF00] hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </section>
  );
}
