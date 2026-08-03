import { getLocale, getTranslations } from "next-intl/server";

import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";
import { requireSession } from "@/lib/auth/session";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe/actions";
import { getCurrentUser, hasActiveSubscription } from "@/lib/subscription/requirePro";

function formatDate(date: Date | null, locale: string): string {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PricingPage() {
  const { email } = await requireSession();
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);
  const t = await getTranslations("Pricing");
  const locale = await getLocale();

  const PRO_FEATURES = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
  ];

  return (
    <AppLayout userEmail={email} isPro={isPro}>
      <Section
        title={t("title")}
        subtitle={t("subtitle")}
      >
        {isPro ? (
          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Badge variant="green">
                {user.subscriptionStatus === "trialing"
                  ? t("trial")
                  : t("pro")}
              </Badge>

              <p className="text-lg font-semibold text-white">
                {t("youHavePro")}
              </p>
            </div>

            {user.subscriptionCurrentPeriodEnd && (
              <p className="mt-3 text-sm text-zinc-500">
                {user.subscriptionStatus === "trialing"
                  ? t("trialEnds")
                  : t("renews")}{" "}
                {formatDate(user.subscriptionCurrentPeriodEnd, locale)}
              </p>
            )}

            <form action={createPortalSession} className="mt-6">
              <Button type="submit" variant="secondary">
                {t("manageSubscription")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">
                {t("price")}
              </p>
              <p className="text-zinc-500">{t("perMonth")}</p>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {t("trialNote")}
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
                {t("startTrial")}
              </Button>
            </form>
          </div>
        )}
      </Section>
    </AppLayout>
  );
}
