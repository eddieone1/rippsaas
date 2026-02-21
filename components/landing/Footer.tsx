import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-rip-black">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1 flex flex-col -mt-6">
            <Link href="/" className="inline-block -m-3 ml-2 shrink-0">
              <img
                src="/rip footer.png"
                alt="Rip - Retention Intelligence Platform"
                className="h-36 w-auto object-contain block"
              />
            </Link>
            <p className="-mt-8 text-sm text-white/65 max-w-[14rem] leading-relaxed break-words">
              Retention Intelligence Platform
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Product</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Company</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <a href="/settings#privacy" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/settings#terms" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Support</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/signup" className="text-sm text-white/65 hover:text-[#9EFF00] transition-colors">
                  Get in touch
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/[0.08] pt-8">
          <p className="text-sm text-white/50">© {year} Rip</p>
        </div>
      </div>
    </footer>
  );
}
