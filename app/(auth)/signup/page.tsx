import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-lime-600 transition-colors mb-4"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Rip
          </a>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-800">
              Trusted by UK gyms
            </span>
          </div>
          <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Start your 14-day free trial
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join gym owners using Rip to predict churn and prove which messages bring members back.
          </p>
          <p className="mt-3 text-center text-xs text-gray-500">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white/60 p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">What happens next</p>
          <ol className="space-y-1.5 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-100 text-lime-700 font-medium">1</span>
              Set up your gym details
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-100 text-lime-700 font-medium">2</span>
              Start your 14-day trial
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-100 text-lime-700 font-medium">3</span>
              Upload members and see what works
            </li>
          </ol>
        </div>

        <p className="text-center text-xs text-gray-500">
          Works with Mindbody, Glofox, and CSV upload
        </p>

        <SignupForm />

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-lime-600 hover:text-lime-500">
            Sign in
          </a>
          {" · "}
          <a href="/join" className="font-medium text-lime-600 hover:text-lime-500">
            Join organisation
          </a>
        </p>
      </div>
    </div>
  );
}
