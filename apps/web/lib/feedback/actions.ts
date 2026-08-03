"use server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function submitFeedback(
  message: string,
  pathname: string
): Promise<{ ok: boolean }> {
  const trimmed = message.trim();

  if (!trimmed) {
    return { ok: false };
  }

  const session = await getSession();

  await prisma.feedback.create({
    data: {
      userId: session?.userId ?? null,
      email: session?.email ?? null,
      message: trimmed,
      pathname,
    },
  });

  return { ok: true };
}
