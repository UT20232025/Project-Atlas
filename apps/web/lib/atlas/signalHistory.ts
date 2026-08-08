import { prisma } from "@/lib/db/client";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import type { AtlasTradeDirection } from "@/lib/atlas/riskEngine";

export type SignalSnapshotView = {
  id: string;
  symbol: MarketSymbol;
  interval: BinanceInterval;
  signal: AtlasTradeDirection;
  confidence: number;
  score: number;
  createdAt: string;
};

type SignalDecision = {
  signal: AtlasTradeDirection;
  confidence: number;
  score: number;
  entry: number | null;
};

export async function recordSignalIfChanged(
  symbol: MarketSymbol,
  interval: BinanceInterval,
  decision: SignalDecision
): Promise<{ changed: boolean }> {
  try {
    const lastSnapshot = await prisma.signalSnapshot.findFirst({
      where: { symbol, interval },
      orderBy: { createdAt: "desc" },
    });

    if (lastSnapshot && lastSnapshot.signal === decision.signal) {
      return { changed: false };
    }

    await prisma.signalSnapshot.create({
      data: {
        symbol,
        interval,
        signal: decision.signal,
        confidence: decision.confidence,
        score: decision.score,
        price: decision.entry,
      },
    });

    return { changed: true };
  } catch (error) {
    console.error(
      "Failed to record Atlas signal history:",
      error
    );

    return { changed: false };
  }
}

/**
 * Per-user alerts: recent LONG/SHORT signal changes on the coins in the
 * user's watchlists. Each SignalSnapshot row is already a change event, so
 * this is a read over existing data — no new table, no extra polling.
 */
export async function getWatchlistAlerts(
  userId: string,
  limit = 15
): Promise<SignalSnapshotView[]> {
  const watchlists = await prisma.watchlist.findMany({
    where: { userId },
    include: { symbols: true },
  });

  const symbols = Array.from(
    new Set(
      watchlists.flatMap((watchlist) =>
        watchlist.symbols.map((entry) => entry.symbol)
      )
    )
  );

  if (symbols.length === 0) {
    return [];
  }

  const since = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  );

  const snapshots = await prisma.signalSnapshot.findMany({
    where: {
      symbol: { in: symbols },
      signal: { in: ["LONG", "SHORT"] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    symbol: snapshot.symbol as MarketSymbol,
    interval: snapshot.interval as BinanceInterval,
    signal: snapshot.signal as AtlasTradeDirection,
    confidence: snapshot.confidence,
    score: snapshot.score,
    createdAt: snapshot.createdAt.toISOString(),
  }));
}

export async function getSignalHistory(
  symbol?: MarketSymbol,
  limit = 20
): Promise<SignalSnapshotView[]> {
  const snapshots = await prisma.signalSnapshot.findMany({
    where: symbol ? { symbol } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    symbol: snapshot.symbol as MarketSymbol,
    interval: snapshot.interval as BinanceInterval,
    signal: snapshot.signal as AtlasTradeDirection,
    confidence: snapshot.confidence,
    score: snapshot.score,
    createdAt: snapshot.createdAt.toISOString(),
  }));
}
