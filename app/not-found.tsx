import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">404 Page Not Found</h2>
        <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
