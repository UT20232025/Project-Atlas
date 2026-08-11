import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import type { User } from "@/lib/generated/prisma/client";

const ACTIVE_STATUSES = ["trialing", "active"];

/**
 * Beta access: grant full Pro without Stripe, controlled by env so the owner
 * flips it on/off without a code change.
 *   BETA_OPEN_ACCESS=1        → every logged-in user gets Pro (open beta)
 *   BETA_ACCESS_EMAILS=a,b,c  → only these emails get Pro (invited beta)
 */
function betaAllowsAccess(email: string | null | undefined): boolean {
  const openFlag = process.env.BETA_OPEN_ACCESS;
  if (openFlag === "1" || openFlag === "true") {
    return true;
  }

  if (!email) {
    return false;
  }

  const allowlist = (process.env.BETA_ACCESS_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.toLowerCase());
}

/** True when this email's Pro access comes from the beta env, not Stripe. */
export function isBetaAccessEmail(
  email: string | null | undefined
): boolean {
  return betaAllowsAccess(email);
}

export function hasActiveSubscription(
  user: Pick<User, "subscriptionStatus" | "email">
): boolean {
  if (betaAllowsAccess(user.email)) {
    return true;
  }

  return (
    user.subscriptionStatus != null &&
    ACTIVE_STATUSES.includes(user.subscriptionStatus)
  );
}

export async function getCurrentUser(): Promise<User> {
  const { userId } = await requireSession();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // Session cookie refers to an account that no longer exists
    // (e.g. deleted after the cookie was issued) — treat it the
    // same as not being logged in rather than crashing the page.
    // Cookies can't be mutated from a Server Component render, so
    // the stale cookie is left in place; /login's own flow
    // overwrites it on the next successful sign-in.
    redirect("/login");
  }

  return user;
}

export async function requirePro(): Promise<User> {
  const user = await getCurrentUser();

  if (!hasActiveSubscription(user)) {
    redirect("/pricing");
  }

  return user;
}
