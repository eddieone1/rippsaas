import Link from "next/link";

interface PlanUpgradePanelProps {
  title: string;
  description: string;
  featureLabel?: string;
}

export default function PlanUpgradePanel({
  title,
  description,
  featureLabel = "Growth",
}: PlanUpgradePanelProps) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-lime-200 bg-lime-50 p-8 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-lime-700">
        {featureLabel} plan
      </p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-3 text-sm text-gray-600">{description}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/settings#subscription"
          className="rounded-lg bg-lime-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lime-500"
        >
          View plans
        </Link>
        <Link
          href="/audit"
          className="rounded-lg border border-lime-300 bg-white px-5 py-2.5 text-sm font-semibold text-lime-800 hover:bg-lime-50"
        >
          Get Free Audit
        </Link>
      </div>
    </div>
  );
}
