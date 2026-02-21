import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
