import type Stripe from "stripe";

import { prisma } from "@/lib/db/client";

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : null,
    },
  });
}

export async function markSubscriptionCanceled(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: "canceled",
      subscriptionCurrentPeriodEnd: null,
    },
  });
}
