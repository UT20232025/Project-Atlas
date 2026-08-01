import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";
import { requireSession } from "@/lib/auth/session";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe/actions";
import { getCurrentUser, hasActiveSubscription } from "@/lib/subscription/requirePro";

const PRO_FEATURES = [
  "Verified Track Record — 24h outcome for every Atlas LONG/SHORT signal",
  "Portfolio — track open positions with live unrealized P&L",
  "Trading Journal — automatic logging + manual entry, CSV export",
  "Custom Watchlists — multiple named lists",
];

function formatDate(date: Date | null): string {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PricingPage() {
  const { email } = await requireSession();
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);

  return (
    <AppLayout userEmail={email} isPro={isPro}>
      <Section
        title="Genwelth AI Pro"
        subtitle="Unlock Track Record, Portfolio, Journal, and Watchlists"
      >
        {isPro ? (
          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Badge variant="green">
                {user.subscriptionStatus === "trialing"
                  ? "TRIAL"
                  : "PRO"}
              </Badge>

              <p className="text-lg font-semibold text-white">
                You have Genwelth AI Pro
              </p>
            </div>

            {user.subscriptionCurrentPeriodEnd && (
              <p className="mt-3 text-sm text-zinc-500">
                {user.subscriptionStatus === "trialing"
                  ? "Trial ends"
                  : "Renews"}{" "}
                {formatDate(user.subscriptionCurrentPeriodEnd)}
              </p>
            )}

            <form action={createPortalSession} className="mt-6">
              <Button type="submit" variant="secondary">
                Manage subscription
              </Button>
            </form>
          </div>
        ) : (
          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">
                199 kr
              </p>
              <p className="text-zinc-500">/ month</p>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              7-day free trial, cancel anytime
            </p>

            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-zinc-300"
                >
                  <span className="mt-0.5 text-green-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <form action={createCheckoutSession} className="mt-6">
              <Button type="submit" size="lg">
                Start 7-day free trial
              </Button>
            </form>
          </div>
        )}
      </Section>
    </AppLayout>
  );
}
