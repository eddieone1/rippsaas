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
    <div className="w-full max-w-md">
      <div className="space-y-8 rounded-xl border border-white/[0.08] bg-[#1a1c1c] p-8 shadow-xl">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Start your 14-day free trial
          </h2>
          <p className="mt-2 text-center text-sm text-white/65">
            No credit card required. Cancel anytime.
          </p>
        </div>
        <PaymentForm />
      </div>
    </div>
  );
}
