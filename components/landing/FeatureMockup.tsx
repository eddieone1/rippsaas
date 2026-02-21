import Image from "next/image";

type MockupType = "dashboard" | "members" | "campaigns" | "insights" | "member-profile" | "roi" | "interventions";

interface FeatureMockupProps {
  type: MockupType;
  alt: string;
  className?: string;
}

// Map mockup types to screenshot file paths
const screenshotMap: Record<MockupType, string | null> = {
  dashboard: "/rip dashboad.png", // Note: filename has typo "dashboad"
  members: "/rip members.png",
  campaigns: null, // No screenshot available yet
  insights: "/rip insights.png",
  "member-profile": "/rip member profile.png",
  roi: null, // No screenshot available yet
  interventions: null, // No screenshot available yet
};

/**
 * App screenshot mockup with real screenshots when available
 */
export default function FeatureMockup({ type, alt, className = "" }: FeatureMockupProps) {
  const screenshotPath = screenshotMap[type];

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ${className}`} role="img" aria-label={alt}>
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-lime-400" />
        </div>
        <div className="ml-4 flex-1 rounded bg-gray-200 px-3 py-1 text-center text-xs font-medium text-gray-600">
          app.rip.co
        </div>
      </div>
      <div className="relative aspect-video bg-white">
        {screenshotPath ? (
          <Image
            src={screenshotPath}
            alt={alt}
            fill
            className="object-contain object-top"
            sizes="(max-width: 768px) 100vw, 672px"
            priority={type === "dashboard"} // Prioritise dashboard image
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3">
            <PlaceholderContent type={type} />
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderContent({ type }: { type: MockupType }) {
  switch (type) {
    case "dashboard":
      return (
        <div className="w-full space-y-4 text-left p-2">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 rounded bg-gray-200" />
            <div className="h-8 w-32 rounded-md bg-lime-500" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "At Risk", value: "23", color: "bg-rose-100" },
              { label: "Avg Score", value: "68", color: "bg-amber-100" },
              { label: "Revenue Risk", value: "£920", color: "bg-red-100" },
              { label: "Revenue Saved", value: "£2,880", color: "bg-lime-100" },
            ].map((card, i) => (
              <div key={i} className={`${card.color} rounded-lg border border-gray-200 p-3`}>
                <div className="text-xs font-medium text-gray-600 mb-1">{card.label}</div>
                <div className="text-lg font-bold text-gray-900">{card.value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 h-5 w-32 rounded bg-gray-200" />
              <div className="h-40 rounded bg-gradient-to-b from-lime-50 to-white border border-gray-100">
                <div className="flex h-full items-end justify-between gap-1 p-2">
                  {[45, 52, 48, 61, 58, 55, 68].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-lime-400"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-80 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
              <div className="h-5 w-36 rounded bg-gray-200 mb-3" />
              {[
                { name: "Sarah Johnson", days: "14", risk: "Medium" },
                { name: "Mike Chen", days: "21", risk: "High" },
                { name: "Emma Davis", days: "18", risk: "Medium" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-2">
                  <div className="flex-1">
                    <div className="h-3 w-24 rounded bg-gray-300 mb-1" />
                    <div className="h-2 w-16 rounded bg-gray-200" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-amber-200 text-xs flex items-center justify-center text-gray-700">
                    {item.risk}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "members":
      return (
        <div className="w-full space-y-3 text-left p-2">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-gray-200" />
            <div className="h-9 w-36 rounded-md bg-lime-500" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700">
              <div className="w-32">Name</div>
              <div className="w-20">Status</div>
              <div className="w-24">Last Visit</div>
              <div className="w-16">Risk</div>
            </div>
            {[
              { name: "Sarah Johnson", status: "Active", visit: "5 days ago", risk: "Low" },
              { name: "Mike Chen", status: "Active", visit: "21 days", risk: "High" },
              { name: "Emma Davis", status: "Active", visit: "14 days", risk: "Medium" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-3 last:border-0">
                <div className="w-32">
                  <div className="h-4 w-28 rounded bg-gray-300 mb-1" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
                <div className="w-20">
                  <div className="h-5 w-16 rounded-full bg-lime-100 text-xs flex items-center justify-center text-gray-700">
                    {item.status}
                  </div>
                </div>
                <div className="w-24">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </div>
                <div className="w-16">
                  <div className={`h-5 w-14 rounded-full text-xs flex items-center justify-center ${
                    item.risk === "High" ? "bg-red-200 text-red-800" :
                    item.risk === "Medium" ? "bg-amber-200 text-amber-800" :
                    "bg-lime-200 text-lime-800"
                  }`}>
                    {item.risk}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "campaigns":
      return (
        <div className="w-full space-y-3 text-left p-2">
          <div className="h-6 w-36 rounded bg-gray-200" />
          <div className="flex gap-2">
            {["21+ Days", "30+ Days", "60+ Days"].map((label, i) => (
              <div
                key={i}
                className={`h-9 rounded-md px-4 text-sm font-medium ${
                  i === 0 ? "bg-lime-500 text-gray-900" : "bg-gray-100 text-gray-700"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-6 w-24 rounded-full bg-lime-100 text-xs flex items-center justify-center text-gray-700">
                Email • 45 sent
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-5/6 rounded bg-gray-200" />
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-8 w-24 rounded-md bg-lime-500" />
              <div className="h-8 w-20 rounded-md border border-gray-300 bg-white" />
            </div>
          </div>
        </div>
      );
    case "insights":
      return (
        <div className="w-full space-y-3 text-left p-2">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button className="h-8 rounded border-b-2 border-lime-500 px-3 text-xs font-medium text-gray-900">
              Engagement
            </button>
            <button className="h-8 px-3 text-xs font-medium text-gray-500">
              Churn
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
              <div className="h-16 rounded bg-gradient-to-br from-lime-50 to-white border border-gray-100">
                <div className="flex h-full items-end justify-center gap-1 p-2">
                  {[65, 72, 68, 75, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-lime-400" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
              <div className="h-16 rounded bg-gradient-to-br from-rose-50 to-white border border-gray-100">
                <div className="flex h-full items-end justify-center gap-1 p-2">
                  {[45, 38, 42, 35, 40].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-rose-400" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
            <div className="h-20 rounded bg-gradient-to-r from-lime-100 via-amber-100 to-rose-100 border border-gray-100">
              <div className="flex h-full items-center justify-around p-2">
                {["Jan", "Feb", "Mar", "Apr", "May"].map((month, i) => (
                  <div key={i} className="text-center">
                    <div className="h-12 w-8 rounded-t bg-lime-400 mb-1" style={{ height: `${60 + i * 5}%` }} />
                    <div className="h-2 w-6 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    case "member-profile":
      return (
        <div className="w-full space-y-3 text-left p-2">
          <div className="h-6 w-44 rounded bg-gray-200" />
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-36 rounded bg-gray-300" />
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-6 w-24 rounded-full bg-amber-200 text-xs flex items-center justify-center font-medium text-amber-900">
                Medium Risk
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
              <div className="flex items-center justify-center">
                <div className="relative h-20 w-20">
                  <svg className="h-20 w-20 transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#84cc16"
                      strokeWidth="3"
                      strokeDasharray={`${68 * 3.14159}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-5 w-8 rounded bg-gray-300 mb-1" />
                      <div className="h-3 w-12 rounded bg-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-5/6 rounded bg-gray-100" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />
              </div>
              <div className="mt-3 h-8 w-full rounded-md bg-lime-500" />
            </div>
          </div>
        </div>
      );
    case "roi":
      return (
        <div className="w-full space-y-3 text-left p-2">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Members Saved", value: "18", color: "bg-lime-100" },
              { label: "Revenue Retained", value: "£2,880", color: "bg-green-100" },
              { label: "Churn Reduction", value: "2.3%", color: "bg-emerald-100" },
            ].map((card, i) => (
              <div key={i} className={`${card.color} rounded-lg border border-gray-200 p-3`}>
                <div className="text-xs font-medium text-gray-600 mb-1">{card.label}</div>
                <div className="text-xl font-bold text-gray-900">{card.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 h-5 w-40 rounded bg-gray-200" />
            <div className="flex items-end justify-between gap-2 h-24">
              <div className="flex-1 space-y-1">
                <div className="h-16 rounded-t bg-gray-200" />
                <div className="h-2 w-12 rounded bg-gray-200 mx-auto" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-20 rounded-t bg-lime-400" />
                <div className="h-2 w-12 rounded bg-gray-200 mx-auto" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                <div className="h-3 w-16 rounded bg-gray-200 mb-1" />
                <div className="h-2 w-12 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      );
    case "interventions":
      return (
        <div className="w-full space-y-3 text-left p-2">
          <div className="h-6 w-44 rounded bg-gray-200" />
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700">
              <div className="w-32">Play</div>
              <div className="w-24">Success Rate</div>
              <div className="w-28">Avg Days</div>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { name: "21+ Days Inactive", rate: "24%", days: "5.2" },
                { name: "30+ Days Inactive", rate: "18%", days: "7.8" },
                { name: "60+ Days Inactive", rate: "12%", days: "12.4" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="w-32">
                    <div className="h-4 w-28 rounded bg-gray-300" />
                  </div>
                  <div className="w-24">
                    <div className="h-6 w-16 rounded-full bg-lime-100 text-xs flex items-center justify-center font-medium text-lime-800">
                      {item.rate}
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="h-4 w-12 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    default:
      return <div className="h-full min-h-[120px] rounded bg-gray-100" />;
  }
}
