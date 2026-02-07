"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hasMessage = error?.message && error.message.length > 0 && !error.message.includes("omitted");
  const isConfigError = hasMessage && (error.message.includes("Supabase env") || error.message.includes("NEXT_PUBLIC_SUPABASE"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        {hasMessage && (
          <p className="mt-2 text-gray-600">{error.message}</p>
        )}
        {!hasMessage && (
          <p className="mt-2 text-gray-600">
            If you&apos;re the site owner, check that <strong>NEXT_PUBLIC_SUPABASE_URL</strong> and{" "}
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> are set in your deployment (e.g. Vercel → Project Settings → Environment Variables), then redeploy.
          </p>
        )}
        {isConfigError && (
          <p className="mt-2 text-sm text-gray-500">
            Add the variables for Production (and Preview if needed), then trigger a new deployment.
          </p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
