import { redirect } from "next/navigation";
import type Stripe from "stripe";

import { requireSession } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe/client";
import { syncSubscriptionFromStripe } from "@/lib/stripe/sync";

type PricingSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PricingSuccessPage({
  searchParams,
}: PricingSuccessPageProps) {
  await requireSession();

  const { session_id: sessionId } = await searchParams;

  if (sessionId) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      sessionId,
      { expand: ["subscription"] }
    );

    if (
      checkoutSession.subscription &&
      typeof checkoutSession.subscription !== "string"
    ) {
      await syncSubscriptionFromStripe(
        checkoutSession.subscription as Stripe.Subscription
      );
    }
  }

  redirect("/pricing");
}
