import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Welcome! Your trial has started
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's get started by uploading your member list
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
            <h3 className="font-medium text-gray-900 mb-2">CSV Format</h3>
            <p className="text-sm text-gray-600 mb-2">
              Your CSV should include these columns:
            </p>
            <code className="block text-xs bg-white p-2 rounded border">
              first_name,last_name,email,phone,joined_date,last_visit_date
            </code>
            <a
              href="/api/members/csv-template"
              download
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
            >
              Download CSV template →
            </a>
          </div>

          <div>
            <Link
              href="/members/upload"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Upload CSV
            </Link>
            <Link
              href="/dashboard"
              className="mt-2 block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Skip for now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
