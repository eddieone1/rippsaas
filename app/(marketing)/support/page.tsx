import SupportForm from "@/components/landing/SupportForm";
import Link from "next/link";

export default function SupportPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 text-lg text-white/65">
            Have a question or need help? Send us a message and we&apos;ll get back to you as soon as we can.
          </p>
        </div>
        <SupportForm />
        <p className="mt-8 text-center text-sm text-white/50">
          Prefer to sign up?{" "}
          <Link href="/audit" className="text-[#9EFF00] hover:underline">
            Get Free Retention Audit
          </Link>
        </p>
      </div>
    </section>
  );
}
