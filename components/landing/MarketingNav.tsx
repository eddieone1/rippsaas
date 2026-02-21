import Link from "next/link";

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10" style={{ backgroundColor: "#1F2121" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/rip dashboard logo - Edited.png"
            alt="Rip - Retention Intelligence Platform"
            className="h-24 w-auto object-contain"
            style={{ marginTop: '-1.5rem', marginBottom: '-1.5rem' }}
          />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/#features"
            className="hidden text-sm font-medium text-gray-300 hover:text-lime-400 transition-colors sm:block"
          >
            Features
          </Link>
          <Link
            href="/integrations"
            className="hidden text-sm font-medium text-gray-300 hover:text-lime-400 transition-colors sm:block"
          >
            Integrations
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-300 hover:text-lime-400 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-300 hover:text-lime-400 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 transition-colors"
          >
            Get a demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
