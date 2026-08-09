"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { parsePositiveNumber } from "@/lib/trading/formData";

export async function createPriceAlert(formData: FormData) {
  const { userId } = await requireSession();

  const symbol = String(formData.get("symbol") ?? "")
    .toUpperCase()
    .trim();
  const targetPrice = parsePositiveNumber(
    formData.get("targetPrice"),
    "Target price"
  );
  const direction =
    String(formData.get("direction") ?? "") === "BELOW"
      ? "BELOW"
      : "ABOVE";

  if (!symbol) {
    throw new Error("Symbol is required.");
  }

  await prisma.priceAlert.create({
    data: { userId, symbol, targetPrice, direction, active: true },
  });

  revalidatePath(`/coin/${symbol}`);
}

export async function deletePriceAlert(formData: FormData) {
  const { userId } = await requireSession();

  const alertId = String(formData.get("alertId") ?? "");
  const symbol = String(formData.get("symbol") ?? "");

  await prisma.priceAlert.deleteMany({
    where: { id: alertId, userId },
  });

  if (symbol) {
    revalidatePath(`/coin/${symbol}`);
  }
}
