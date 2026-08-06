import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import Section from "@/components/ui/Section";
import { prisma } from "@/lib/db/client";
import { isAdmin } from "@/lib/subscription/isAdmin";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "@/lib/subscription/requirePro";

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Non-admins get a 404 so the route's existence stays hidden.
  if (!isAdmin(user.email)) {
    notFound();
  }

  const t = await getTranslations("Admin");
  const locale = await getLocale();

  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  const [total, active, paying, trialing, newThisWeek] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          subscriptionStatus: {
            in: ["active", "trialing"],
          },
        },
      }),
      prisma.user.count({
        where: { subscriptionStatus: "active" },
      }),
      prisma.user.count({
        where: { subscriptionStatus: "trialing" },
      }),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

  const conversion =
    total > 0 ? (active / total) * 100 : 0;

  const stats: Array<{ label: string; value: string }> = [
    {
      label: t("totalUsers"),
      value: total.toLocaleString(locale),
    },
    {
      label: t("activeSubscribers"),
      value: active.toLocaleString(locale),
    },
    {
      label: t("paying"),
      value: paying.toLocaleString(locale),
    },
    {
      label: t("trialing"),
      value: trialing.toLocaleString(locale),
    },
    {
      label: t("conversion"),
      value: `${conversion.toFixed(1)}%`,
    },
    {
      label: t("newThisWeek"),
      value: newThisWeek.toLocaleString(locale),
    },
  ];

  return (
    <AppLayout
      userEmail={user.email}
      isPro={hasActiveSubscription(user)}
    >
      <Section title={t("title")} subtitle={t("subtitle")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="atlas-subcard rounded-xl p-6"
            >
              <p className="text-xs text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </AppLayout>
  );
}
