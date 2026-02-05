import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaymentForm from "@/components/onboarding/PaymentForm";

export default async function PaymentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Start your 14-day free trial
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No credit card required. Cancel anytime.
          </p>
        </div>
        <PaymentForm />
      </div>
    </div>
  );
}
