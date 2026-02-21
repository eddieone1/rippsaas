import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10" style={{ backgroundColor: "#1F2121" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-gray-400">
            <Link
              href="/dashboard"
              className="hover:text-lime-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/members"
              className="hover:text-lime-400 transition-colors"
            >
              Members
            </Link>
            <Link
              href="/plays"
              className="hover:text-lime-400 transition-colors"
            >
              Plays
            </Link>
            <Link
              href="/insights"
              className="hover:text-lime-400 transition-colors"
            >
              Insights
            </Link>
            <Link
              href="/settings"
              className="hover:text-lime-400 transition-colors"
            >
              Settings
            </Link>
            <span className="text-gray-500" aria-hidden>|</span>
            <Link
              href="/settings#privacy"
              className="hover:text-lime-400 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/settings#terms"
              className="hover:text-lime-400 transition-colors"
            >
              Terms
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Rip. All rights reserved.
            </p>
            <img
              src="/rip footer.png"
              alt="Rip logo"
              className="h-24 w-auto object-contain"
              style={{ marginTop: '-2.5rem', marginBottom: '-2.5rem' }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
