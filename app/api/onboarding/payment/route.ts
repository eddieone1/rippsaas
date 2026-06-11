import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripePriceId, type PlanId } from "@/lib/pricing";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rip.app";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = body.planId as PlanId | undefined;

    if (!planId || !["free_audit", "starter_49", "growth_79"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const { data: userProfile } = await adminClient
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const gymId = userProfile.gym_id;

    if (planId === "free_audit") {
      await adminClient
        .from("gyms")
        .update({
          subscription_status: "canceled",
          trial_ends_at: null,
          plan_id: "free_audit",
        })
        .eq("id", gymId);

      await adminClient
        .from("users")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", user.id);

      return NextResponse.json({ success: true, planId: "free_audit" });
    }

    // Paid plans — persist intended plan and route to Stripe Checkout
    const priceId = getStripePriceId(planId);
    if (!stripe || !priceId) {
      // TODO: Set NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID and NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID in env
      await adminClient
        .from("gyms")
        .update({
          subscription_status: "canceled",
          trial_ends_at: null,
          plan_id: planId,
        })
        .eq("id", gymId);

      await adminClient
        .from("users")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        planId,
        checkoutUrl: null,
        message: "Stripe not configured — proceeding to upload. Configure price IDs for live checkout.",
      });
    }

    await adminClient
      .from("gyms")
      .update({ plan_id: planId })
      .eq("id", gymId);

    const { data: gym } = await adminClient
      .from("gyms")
      .select("id, owner_email")
      .eq("id", gymId)
      .single();

    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/onboarding/upload?checkout=success&plan=${planId}`,
      cancel_url: `${APP_URL}/onboarding/payment`,
      customer_email: gym.owner_email,
      metadata: { gym_id: gym.id, plan_id: planId },
      subscription_data: {
        metadata: { gym_id: gym.id, plan_id: planId },
      },
    });

    return NextResponse.json({
      success: true,
      planId,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Payment setup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
