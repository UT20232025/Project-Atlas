import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";
import { requireSession } from "@/lib/auth/session";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe/actions";
import { getCurrentUser, hasActiveSubscription } from "@/lib/subscription/requirePro";

const PRO_FEATURES = [
  "Verified Track Record — 24t-utfall for hvert Atlas LONG/SHORT-signal",
  "Portfolio — spor åpne posisjoner med live urealisert P&L",
  "Trading Journal — automatisk logging + manuell registrering, CSV-eksport",
  "Egendefinerte Watchlists — flere navngitte lister",
];

function formatDate(date: Date | null): string {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("nb-NO", {
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
        subtitle="Lås opp Track Record, Portfolio, Journal og Watchlists"
      >
        {isPro ? (
          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Badge variant="green">
                {user.subscriptionStatus === "trialing"
                  ? "PRØVEPERIODE"
                  : "PRO"}
              </Badge>

              <p className="text-lg font-semibold text-white">
                Du har Genwelth AI Pro
              </p>
            </div>

            {user.subscriptionCurrentPeriodEnd && (
              <p className="mt-3 text-sm text-zinc-500">
                {user.subscriptionStatus === "trialing"
                  ? "Prøveperioden slutter"
                  : "Fornyes"}{" "}
                {formatDate(user.subscriptionCurrentPeriodEnd)}
              </p>
            )}

            <form action={createPortalSession} className="mt-6">
              <Button type="submit" variant="secondary">
                Administrer abonnement
              </Button>
            </form>
          </div>
        ) : (
          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">
                199 kr
              </p>
              <p className="text-zinc-500">/ måned</p>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              7 dager gratis prøveperiode, avbryt når som helst
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
                Start 7 dagers gratis prøve
              </Button>
            </form>
          </div>
        )}
      </Section>
    </AppLayout>
  );
}
