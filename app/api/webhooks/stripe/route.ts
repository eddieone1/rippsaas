import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const gymId = session.metadata?.gym_id as string | undefined;
        const customerId = session.customer as string | undefined;
        const subscriptionId = session.subscription as string | undefined;

        if (!gymId && !customerId) break;

        const planId = session.metadata?.plan_id as string | undefined;
        const update: Record<string, unknown> = {
          stripe_customer_id: customerId || undefined,
          stripe_subscription_id: subscriptionId || undefined,
        };

        if (planId === "starter_49" || planId === "growth_79") {
          update.plan_id = planId;
        }

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          update.subscription_status =
            subscription.status === "active"
              ? "active"
              : subscription.status === "trialing"
              ? "trialing"
              : subscription.status === "past_due"
              ? "past_due"
              : "canceled";
        }

        if (gymId) {
          await adminClient.from("gyms").update(update).eq("id", gymId);
        } else if (customerId) {
          await adminClient
            .from("gyms")
            .update(update)
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const gymId = subscription.metadata?.gym_id as string | undefined;

        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "trialing"
            ? "trialing"
            : subscription.status === "past_due"
            ? "past_due"
            : "canceled";

        const planId = subscription.metadata?.plan_id as string | undefined;
        const update: Record<string, unknown> = {
          stripe_subscription_id: subscription.id,
          subscription_status: status,
        };

        if (planId === "starter_49" || planId === "growth_79") {
          update.plan_id = planId;
        }

        if (gymId) {
          await adminClient.from("gyms").update(update).eq("id", gymId);
        } else {
          await adminClient
            .from("gyms")
            .update(update)
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const gymId = subscription.metadata?.gym_id as string | undefined;

        if (gymId) {
          await adminClient
            .from("gyms")
            .update({ subscription_status: "canceled" })
            .eq("id", gymId);
        } else {
          await adminClient
            .from("gyms")
            .update({ subscription_status: "canceled" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
