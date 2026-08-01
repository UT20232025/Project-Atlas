import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/client";
import {
  markSubscriptionCanceled,
  syncSubscriptionFromStripe,
} from "@/lib/stripe/sync";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncSubscriptionFromStripe(
        event.data.object as Stripe.Subscription
      );
      break;
    }

    case "customer.subscription.deleted": {
      await markSubscriptionCanceled(
        event.data.object as Stripe.Subscription
      );
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
