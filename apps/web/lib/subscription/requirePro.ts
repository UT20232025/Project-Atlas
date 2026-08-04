import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import type { User } from "@/lib/generated/prisma/client";

const ACTIVE_STATUSES = ["trialing", "active"];

export function hasActiveSubscription(
  user: Pick<User, "subscriptionStatus">
): boolean {
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
