import Link from "next/link";

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10" style={{ backgroundColor: "#1F2121" }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="inline-block">
              <img
                src="/rip footer.png"
                alt="Rip"
                className="h-52 w-auto object-contain opacity-90"
                style={{ marginTop: '-5rem', marginBottom: '-4rem', marginLeft: '0' }}
              />
            </Link>
            <p className="text-sm text-gray-400" style={{ marginTop: '-3rem', paddingTop: '1rem' }}>
              Retention intelligence for gyms and studios. Prove what works.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Product</h4>
            <ul className="mt-4 space-y-3">
              <li><Link href="/#features" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Pricing</Link></li>
              <li><Link href="/audit" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Get Free Audit</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Company</h4>
            <ul className="mt-4 space-y-3">
              <li><Link href="/login" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Sign in</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Support</h4>
            <ul className="mt-4 space-y-3">
              <li><Link href="/audit" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">Free Retention Audit</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-400 hover:text-lime-400 transition-colors">View pricing</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-8">
          <p className="text-sm text-gray-500">© {currentYear} Rip. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
