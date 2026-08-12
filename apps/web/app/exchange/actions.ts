"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import {
  encryptSecret,
  isSecretBoxConfigured,
} from "@/lib/crypto/secretBox";
import { prisma } from "@/lib/db/client";
import { verifyBinanceKey } from "@/lib/exchange/binance";

export async function connectExchange(formData: FormData) {
  const { userId } = await requireSession();

  if (!isSecretBoxConfigured()) {
    redirect("/settings?exchange=notconfigured");
  }

  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const secret = String(formData.get("secret") ?? "").trim();

  if (!apiKey || !secret) {
    redirect("/settings?exchange=invalid");
  }

  // Verify the key works (read-only account read) before storing anything.
  const verify = await verifyBinanceKey(apiKey, secret);

  if (!verify.ok) {
    redirect("/settings?exchange=failed");
  }

  const secretCipher = encryptSecret(secret);

  await prisma.exchangeConnection.upsert({
    where: { userId },
    update: { exchange: "binance", apiKey, secretCipher },
    create: { userId, exchange: "binance", apiKey, secretCipher },
  });

  revalidatePath("/settings");
  revalidatePath("/portfolio");
  redirect("/settings?exchange=connected");
}

export async function disconnectExchange() {
  const { userId } = await requireSession();

  await prisma.exchangeConnection.deleteMany({ where: { userId } });

  revalidatePath("/settings");
  revalidatePath("/portfolio");
  redirect("/settings?exchange=disconnected");
}
