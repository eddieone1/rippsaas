import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "@/components/auth/SignupForm";

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
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-lime-600 hover:text-lime-500"
            >
              Sign in
            </a>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
