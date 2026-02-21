export default function Metrics() {
  const items = [
    { value: "2–3%", label: "Increase retention rate", sub: "With targeted interventions" },
    { value: "4x", label: "higher average LTV", sub: "When you keep members longer" },
    { value: "14 days", label: "setup and go-live", sub: "No long-term contracts" },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 text-center">
          {items.map((item) => (
            <div key={item.label}>
              <div className="text-3xl font-bold text-[#9EFF00] sm:text-4xl">{item.value}</div>
              <p className="mt-2 text-base font-medium text-white">{item.label}</p>
              <p className="mt-1 text-sm text-white/50">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
