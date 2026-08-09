import { prisma } from "@/lib/db/client";
import {
  fetchSingleMarket,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";
import {
  fetchStockQuote,
  isStockSymbol,
} from "@/lib/services/twelveDataService";

export type AlertDirection = "ABOVE" | "BELOW";

export type PriceAlertView = {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  createdAt: string;
};

export type TriggeredAlert = {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  price: number;
};

function normalizeDirection(value: string): AlertDirection {
  return value === "BELOW" ? "BELOW" : "ABOVE";
}

export async function getPriceAlertsForSymbol(
  userId: string,
  symbol: string
): Promise<PriceAlertView[]> {
  const rows = await prisma.priceAlert.findMany({
    where: { userId, symbol: symbol.toUpperCase(), active: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    targetPrice: row.targetPrice,
    direction: normalizeDirection(row.direction),
    createdAt: row.createdAt.toISOString(),
  }));
}

async function currentPrice(symbol: string): Promise<number | null> {
  if (isStockSymbol(symbol)) {
    const quote = await fetchStockQuote(symbol);
    return quote?.price ?? null;
  }

  const market = await fetchSingleMarket(symbol as MarketSymbol);
  return market?.price ?? null;
}

/**
 * Checks the user's active price alerts against live prices. Any alert whose
 * condition is met is flipped to inactive (triggeredAt set) and returned as a
 * one-time notification; the rest come back as still-active with their current
 * price. Pull-based (runs on dashboard load) — no background job, no email.
 */
export async function checkTriggeredAlerts(userId: string): Promise<{
  triggered: TriggeredAlert[];
  active: Array<PriceAlertView & { price: number | null }>;
}> {
  const rows = await prisma.priceAlert.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (rows.length === 0) {
    return { triggered: [], active: [] };
  }

  const symbols = Array.from(new Set(rows.map((row) => row.symbol)));
  const priceEntries = await Promise.all(
    symbols.map(
      async (symbol) => [symbol, await currentPrice(symbol)] as const
    )
  );
  const priceMap = new Map(priceEntries);

  const triggered: TriggeredAlert[] = [];
  const active: Array<PriceAlertView & { price: number | null }> = [];
  const toTrigger: string[] = [];

  for (const row of rows) {
    const price = priceMap.get(row.symbol) ?? null;
    const direction = normalizeDirection(row.direction);
    const hit =
      price !== null &&
      ((direction === "ABOVE" && price >= row.targetPrice) ||
        (direction === "BELOW" && price <= row.targetPrice));

    if (hit && price !== null) {
      triggered.push({
        id: row.id,
        symbol: row.symbol,
        targetPrice: row.targetPrice,
        direction,
        price,
      });
      toTrigger.push(row.id);
    } else {
      active.push({
        id: row.id,
        symbol: row.symbol,
        targetPrice: row.targetPrice,
        direction,
        createdAt: row.createdAt.toISOString(),
        price,
      });
    }
  }

  if (toTrigger.length > 0) {
    await prisma.priceAlert.updateMany({
      where: { id: { in: toTrigger } },
      data: { active: false, triggeredAt: new Date() },
    });
  }

  return { triggered, active };
}
