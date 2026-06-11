import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiAuth } from "@/lib/auth/guards";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripePriceId, type PlanId } from "@/lib/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rip.app";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedPlan = body.planId as PlanId | undefined;
    const planId: "starter_49" | "growth_79" =
      requestedPlan === "growth_79" ? "growth_79" : "starter_49";

    const priceId = getStripePriceId(planId);
    if (!priceId) {
      // TODO: Insert real Stripe price IDs in NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID / NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID
      return NextResponse.json(
        { error: "Billing is not configured for this plan" },
        { status: 503 }
      );
    }

    const { gymId } = await requireApiAuth();
    const adminClient = createAdminClient();

    const { data: gym } = await adminClient
      .from("gyms")
      .select("id, owner_email, subscription_status")
      .eq("id", gymId)
      .single();

    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    if (gym.subscription_status === "active") {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/settings?upgraded=1&plan=${planId}`,
      cancel_url: `${APP_URL}/settings#subscription`,
      customer_email: gym.owner_email,
      metadata: { gym_id: gym.id, plan_id: planId },
      subscription_data: {
        metadata: { gym_id: gym.id, plan_id: planId },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url, planId });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
