export default function FeatureRow() {
  const cards = [
    {
      title: "Retention Overview",
      items: [
        { label: "At-risk (high)", value: "5", pct: 60 },
        { label: "At-risk (medium)", value: "12", pct: 40 },
        { label: "Re-engaged", value: "8", pct: 80 },
      ],
    },
    {
      title: "Automated Campaigns",
      items: [
        { label: "21-day check-in", status: "Sent" },
        { label: "30-day we miss you", status: "Sent" },
        { label: "60-day win-back", status: "Scheduled" },
      ],
    },
    {
      title: "Smart Member Action Queue",
      items: [
        { name: "Jamie L.", tag: "High risk" },
        { name: "Sam K.", tag: "Medium risk" },
        { name: "Alex P.", tag: "High risk" },
      ],
    },
  ];

  return (
    <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Know Who&apos;s at Risk, Before You Lose Them.
        </h2>
        <p className="mt-3 text-center text-lg text-white/65 max-w-2xl mx-auto">
          Find, engage, and retain members using data-driven insights and automation.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-white/[0.08] bg-rip-bg-2 p-5 shadow-lg"
            >
              <h3 className="text-sm font-semibold text-white mb-4">{card.title}</h3>
              <div className="space-y-3">
                {"pct" in card.items[0] ? (
                  (card.items as { label: string; value: string; pct: number }[]).map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-white/70 mb-1">
                        <span>{item.label}</span>
                        <span className="text-[#9EFF00]">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#9EFF00]/60"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : "status" in card.items[0] ? (
                  (card.items as { label: string; status: string }[]).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{item.label}</span>
                      <span className="rounded bg-[#9EFF00]/20 px-2 py-0.5 text-xs font-medium text-[#9EFF00]">
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  (card.items as { name: string; tag: string }[]).map((item) => (
                    <div key={item.name} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                      <span className="text-sm text-white/80">{item.name}</span>
                      <span className="text-xs text-[#9EFF00]/90">{item.tag}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
