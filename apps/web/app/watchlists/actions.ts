"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/client";
import { Prisma } from "@/lib/generated/prisma/client";
import { parseSymbol } from "@/lib/trading/formData";
import { MARKET_SYMBOLS } from "@/lib/services/liveMarketService";

export async function createWatchlist(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length === 0) {
    throw new Error("Watchlist name cannot be empty.");
  }

  await prisma.watchlist.create({
    data: { name },
  });

  revalidatePath("/");
}

export async function deleteWatchlist(formData: FormData) {
  const watchlistId = String(
    formData.get("watchlistId") ?? ""
  );

  await prisma.watchlist.delete({
    where: { id: watchlistId },
  });

  revalidatePath("/");
}

export async function addSymbolToWatchlist(
  formData: FormData
) {
  const watchlistId = String(
    formData.get("watchlistId") ?? ""
  );
  const symbol = parseSymbol(formData.get("symbol"));

  try {
    await prisma.watchlistSymbol.create({
      data: { watchlistId, symbol },
    });
  } catch (error) {
    const isDuplicate =
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    if (!isDuplicate) {
      throw error;
    }
  }

  revalidatePath("/");
}

export async function removeSymbolFromWatchlist(
  formData: FormData
) {
  const watchlistId = String(
    formData.get("watchlistId") ?? ""
  );
  const symbol = parseSymbol(formData.get("symbol"));

  await prisma.watchlistSymbol.deleteMany({
    where: { watchlistId, symbol },
  });

  revalidatePath("/");
}

export async function migrateLegacyFavorites(
  formData: FormData
) {
  const existingCount = await prisma.watchlist.count();

  if (existingCount > 0) {
    return;
  }

  const rawSymbols = String(
    formData.get("symbols") ?? "[]"
  );

  let symbols: string[];

  try {
    const parsed = JSON.parse(rawSymbols);

    symbols = Array.isArray(parsed)
      ? parsed.filter((symbol) =>
          MARKET_SYMBOLS.includes(symbol)
        )
      : [];
  } catch {
    symbols = [];
  }

  if (symbols.length === 0) {
    return;
  }

  await prisma.watchlist.create({
    data: {
      name: "Favoritter",
      symbols: {
        create: symbols.map((symbol) => ({
          symbol: String(symbol),
        })),
      },
    },
  });

  revalidatePath("/");
}
