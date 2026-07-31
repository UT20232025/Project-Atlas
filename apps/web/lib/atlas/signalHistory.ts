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
): Promise<void> {
  try {
    const lastSnapshot = await prisma.signalSnapshot.findFirst({
      where: { symbol, interval },
      orderBy: { createdAt: "desc" },
    });

    if (lastSnapshot && lastSnapshot.signal === decision.signal) {
      return;
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
  } catch (error) {
    console.error(
      "Failed to record Atlas signal history:",
      error
    );
  }
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
