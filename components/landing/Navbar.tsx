import Link from "next/link";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-white/[0.08] bg-rip-bg/95 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(15, 17, 17, 0.95)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/rip dashboard logo - Edited.png"
            alt="Rip - Retention Intelligence Platform"
            className="h-32 w-auto object-contain -my-9 block"
          />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/#features"
            className="text-sm font-medium text-white/80 hover:text-[#9EFF00] transition-colors hidden sm:inline"
          >
            Features
          </Link>
          <Link
            href="/integrations"
            className="text-sm font-medium text-white/80 hover:text-[#9EFF00] transition-colors hidden sm:inline"
          >
            Integrations
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-white/80 hover:text-[#9EFF00] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-[#9EFF00]/40 px-4 py-2 text-sm font-semibold text-white/80 hover:text-[#9EFF00] hover:border-[#9EFF00]/60 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#9EFF00] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            Start free trial
          </Link>
        </nav>
      </div>
    </header>
  );
}
