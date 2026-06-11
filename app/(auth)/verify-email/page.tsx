import Link from "next/link";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? "your email";

  return (
    <div className="flex flex-1 w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-100">
            <svg
              className="h-6 w-6 text-lime-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-gray-900">{email}</span>. Click it
            to activate your account.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Once verified, sign in to complete your gym setup or request your
            free retention audit.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-md border border-transparent bg-lime-500 px-4 py-3 text-center text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
          >
            Go to sign in
          </Link>
          <p className="text-center text-xs text-gray-500">
            Didn&apos;t receive the email? Check spam or{" "}
            <a href="/login" className="font-medium text-lime-600 hover:text-lime-500">
              try signing in again
            </a>
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-lime-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rip
        </a>
      </div>
    </div>
  );
}
