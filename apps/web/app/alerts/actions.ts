"use server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getCurrentSignal } from "@/lib/alerts/signalAlerts";

// Is the current user subscribed to signal alerts for this symbol?
export async function isSignalAlertOn(symbol: string): Promise<boolean> {
  const { userId } = await requireSession();
  const row = await prisma.signalAlert.findUnique({
    where: { userId_symbol: { userId, symbol } },
    select: { id: true },
  });
  return row !== null;
}

// Toggle a "notify me when this becomes a trade" alert. Seeds lastSignal with
// the current signal so the user is only pinged on the NEXT flip, not a signal
// that's already live. Returns the new on/off state.
export async function toggleSignalAlert(symbol: string): Promise<boolean> {
  const { userId } = await requireSession();

  const existing = await prisma.signalAlert.findUnique({
    where: { userId_symbol: { userId, symbol } },
    select: { id: true },
  });

  if (existing) {
    await prisma.signalAlert.delete({ where: { id: existing.id } });
    return false;
  }

  const current = (await getCurrentSignal(symbol)) ?? "WAIT";
  await prisma.signalAlert.create({
    data: { userId, symbol, lastSignal: current },
  });
  return true;
}
