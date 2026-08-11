import webpush from "web-push";

import { prisma } from "@/lib/db/client";

let configured = false;

function ensureConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:hei@genwelth.com",
      publicKey,
      privateKey
    );
    configured = true;
  }

  return true;
}

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function deliver(
  sub: StoredSubscription,
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    // 404/410 = the subscription is gone (user uninstalled / revoked) — prune it.
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: sub.id } })
        .catch(() => {});
    } else {
      console.error("Web push send failed:", statusCode ?? error);
    }
  }
}

/** Sends a push to every subscription of a single user. */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!ensureConfigured()) {
    return;
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  await Promise.all(subs.map((sub) => deliver(sub, payload)));
}

/** Broadcasts a push to every subscribed device (used for signal changes). */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ take: 5000 });

  await Promise.all(subs.map((sub) => deliver(sub, payload)));
}
