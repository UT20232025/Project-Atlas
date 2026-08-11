import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import PushToggle from "@/components/push/PushToggle";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Section from "@/components/ui/Section";
import { logout } from "@/lib/auth/actions";
import { requireSession } from "@/lib/auth/session";
import { createPortalSession } from "@/lib/stripe/actions";
import { getCurrentUser, hasActiveSubscription } from "@/lib/subscription/requirePro";

export default async function SettingsPage() {
  const { email } = await requireSession();
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);
  const t = await getTranslations("Settings");
  const tPush = await getTranslations("PushNotifications");
  const locale = await getLocale();

  return (
    <AppLayout userEmail={email} isPro={isPro}>
      <Section title={t("title")} subtitle={t("subtitle")}>
        <div className="space-y-6">
          <div className="atlas-subcard rounded-2xl p-6">
            <h3 className="font-semibold text-white">{t("account")}</h3>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-zinc-500">{t("email")}</p>
                <p className="mt-1 text-zinc-300">{user.email}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">{t("memberSince")}</p>
                <p className="mt-1 text-zinc-300">
                  {user.createdAt.toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="atlas-subcard rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-white">{t("subscription")}</h3>
              <Badge variant={isPro ? "green" : "yellow"}>
                {isPro
                  ? user.subscriptionStatus === "trialing"
                    ? t("trial")
                    : t("pro")
                  : t("free")}
              </Badge>
            </div>

            {isPro ? (
              <form action={createPortalSession} className="mt-4">
                <Button type="submit" variant="secondary">
                  {t("manageSubscription")}
                </Button>
              </form>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-zinc-400">
                  {t("upgradeCopy")}
                </p>

                <Link href="/pricing" className="mt-4 inline-block">
                  <Button>{t("viewPlans")}</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="atlas-subcard rounded-2xl p-6">
            <h3 className="font-semibold text-white">
              {tPush("title")}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {tPush("subtitle")}
            </p>

            <div className="mt-4">
              <PushToggle />
            </div>
          </div>

          <div className="atlas-subcard rounded-2xl p-6">
            <h3 className="font-semibold text-white">{t("language")}</h3>
            <p className="mt-1 text-sm text-zinc-500">{t("languageSubtitle")}</p>

            <div className="mt-4 max-w-xs">
              <LanguageSwitcher locale={locale} />
            </div>
          </div>

          <div className="atlas-subcard rounded-2xl p-6">
            <h3 className="font-semibold text-white">{t("session")}</h3>

            <form action={logout} className="mt-4">
              <Button type="submit" variant="secondary">
                {t("logout")}
              </Button>
            </form>
          </div>
        </div>
      </Section>
    </AppLayout>
  );
}
