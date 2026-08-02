import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";
import { logout } from "@/lib/auth/actions";
import { requireSession } from "@/lib/auth/session";
import { createPortalSession } from "@/lib/stripe/actions";
import { getCurrentUser, hasActiveSubscription } from "@/lib/subscription/requirePro";

export default async function SettingsPage() {
  const { email } = await requireSession();
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);

  return (
    <AppLayout userEmail={email} isPro={isPro}>
      <Section title="Settings" subtitle="Your account and subscription">
        <div className="space-y-6">
          <div className="atlas-subcard rounded-2xl p-6">
            <h3 className="font-semibold text-white">Account</h3>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="mt-1 text-zinc-300">{user.email}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">Member since</p>
                <p className="mt-1 text-zinc-300">
                  {user.createdAt.toLocaleDateString("en-US", {
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
              <h3 className="font-semibold text-white">Subscription</h3>
              <Badge variant={isPro ? "green" : "yellow"}>
                {isPro
                  ? user.subscriptionStatus === "trialing"
                    ? "TRIAL"
                    : "PRO"
                  : "FREE"}
              </Badge>
            </div>

            {isPro ? (
              <form action={createPortalSession} className="mt-4">
                <Button type="submit" variant="secondary">
                  Manage subscription
                </Button>
              </form>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-zinc-400">
                  Upgrade to Genwelth AI Pro to unlock Track Record,
                  Portfolio, Trading Journal, and Watchlists.
                </p>

                <Link href="/pricing" className="mt-4 inline-block">
                  <Button>View plans</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="atlas-subcard rounded-2xl p-6">
            <h3 className="font-semibold text-white">Session</h3>

            <form action={logout} className="mt-4">
              <Button type="submit" variant="secondary">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </Section>
    </AppLayout>
  );
}
