import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rip.app";

export async function POST() {
  try {
    const { gymId } = await requireApiAuth();
    const supabase = await createClient();

    const { data: gym } = await supabase
      .from("gyms")
      .select("stripe_customer_id")
      .eq("id", gymId)
      .single();

    if (!gym?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe first." },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: gym.stripe_customer_id,
      return_url: `${APP_URL}/settings#subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create portal session error:", error);
    return NextResponse.json(
      { error: "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
