import { redirect } from "next/navigation";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import CSVUploadForm from "@/components/members/CSVUploadForm";

export default async function MemberUploadPage() {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload / update member data</h1>
        <p className="mt-2 text-sm text-gray-600">
          Import members from CSV or update existing ones. Include visits and details; existing members are recognised by name plus date of birth or email to prevent duplicates.
        </p>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-lime-50/40 p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60">
            <svg className="h-6 w-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h2" />
              <path d="M8 17h2" />
              <path d="M16 13h-2" />
              <path d="M16 17h-2" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-800 tracking-tight">Recommended CSV format</h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              Use a header row with column names as below (or close equivalents). Visits: use a single &quot;visits&quot; column (semicolon-separated dates) or columns like &quot;visit 1&quot;, &quot;visit 2&quot;, &quot;visit 3&quot; — all are recorded; most recent becomes last visit. Dates as YYYY-MM-DD.
            </p>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/90">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">first_name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">last_name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">email</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">date_of_birth</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">visits</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">joined_date</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-white">
                  <td className="px-4 py-3 text-slate-700">Jane</td>
                  <td className="px-4 py-3 text-slate-700">Smith</td>
                  <td className="px-4 py-3 text-slate-600">jane@example.com</td>
                  <td className="px-4 py-3 text-slate-700">1990-05-15</td>
                  <td className="px-4 py-3 text-slate-600">2025-01-20;2025-01-15;…</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">active</span></td>
                  <td className="px-4 py-3 text-slate-500">2024-06-01</td>
                  <td className="px-4 py-3 text-slate-500">123 High St</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-700">John</td>
                  <td className="px-4 py-3 text-slate-700">Doe</td>
                  <td className="px-4 py-3 text-slate-600">john@example.com</td>
                  <td className="px-4 py-3 text-slate-700">1985-11-22</td>
                  <td className="px-4 py-3 text-slate-600">2025-01-18</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">inactive</span></td>
                  <td className="px-4 py-3 text-slate-400">—</td>
                  <td className="px-4 py-3 text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 leading-relaxed">
          Required: first_name, last_name, email, date_of_birth, status (active/inactive). Visits: optional; use &quot;visits&quot; and/or &quot;visit 1&quot;, &quot;visit 2&quot;, etc. — all recorded. Optional: joined_date, address. Similar column names are recognised automatically.
        </p>
      </div>

      <CSVUploadForm />
    </div>
  );
}
