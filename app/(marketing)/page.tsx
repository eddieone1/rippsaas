import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/landing/Hero";
import StatCard from "@/components/landing/StatCard";
import HowItWorks from "@/components/landing/HowItWorks";
import ProveWhatWorks from "@/components/landing/ProveWhatWorks";
import FeatureRow from "@/components/landing/FeatureRow";
import Metrics from "@/components/landing/Metrics";
import Testimonials from "@/components/landing/Testimonials";
import FinalCTA from "@/components/landing/FinalCTA";

export default async function MarketingLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <Hero />
      <StatCard />
      <HowItWorks />
      <ProveWhatWorks />
      <FeatureRow />
      <Metrics />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
