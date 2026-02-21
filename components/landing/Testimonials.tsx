export default function Testimonials() {
  const testimonials = [
    {
      quote: "We finally see who's about to leave before they cancel. Rip surfaced members we'd have missed.",
      name: "Marcus Webb",
      role: "Owner, FitHub Gym",
      initials: "MW",
    },
    {
      quote: "The campaigns run themselves and we get proof of what actually brings people back. Game changer.",
      name: "Sarah Chen",
      role: "Studio Director, Pulse Fitness",
      initials: "SC",
    },
    {
      quote: "Setup was quick, and the retention metrics gave us numbers we could show the board.",
      name: "James Okonkwo",
      role: "Operations, Core Strength",
      initials: "JO",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Purpose built for businesses like yours.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-white/[0.08] bg-rip-bg-2 p-6 shadow-lg"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-[#9EFF00]" aria-hidden>★</span>
                ))}
              </div>
              <p className="text-sm text-white/80 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/55">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
