"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";

  return `${protocol}://${host}`;
}

async function getOrCreateStripeCustomerId(
  userId: string,
  email: string
): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({ email });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession() {
  const { userId, email } = await requireSession();
  const origin = await getOrigin();

  const customerId = await getOrCreateStripeCustomerId(
    userId,
    email
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      { price: process.env.STRIPE_PRICE_ID, quantity: 1 },
    ],
    subscription_data: { trial_period_days: 7 },
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  redirect(checkoutSession.url);
}

export async function createPortalSession() {
  const { userId } = await requireSession();
  const origin = await getOrigin();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  if (!user.stripeCustomerId) {
    redirect("/pricing");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/pricing`,
  });

  redirect(portalSession.url);
}
