import { prisma } from "@/lib/db/client";
import { fetchHistoricalClosePrice } from "@/lib/services/binanceCandleService";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

const HORIZON_MS = 24 * 60 * 60 * 1000;

export type TrackRecordTrade = {
  id: string;
  symbol: MarketSymbol;
  interval: BinanceInterval;
  signal: "LONG" | "SHORT";
  confidence: number;
  entryPrice: number;
  createdAt: string;
  horizonAt: string;
  status: "OPEN" | "CLOSED";
  exitPrice: number | null;
  pnlPercent: number | null;
};

export type TrackRecordSymbolBreakdown = {
  symbol: MarketSymbol;
  trades: number;
  wins: number;
  winRate: number;
  avgPnlPercent: number;
};

export type TrackRecordGroupBreakdown = {
  key: string;
  trades: number;
  wins: number;
  winRate: number;
  avgPnlPercent: number;
};

const CONFIDENCE_BUCKET_ORDER = [
  "<60",
  "60–69",
  "70–79",
  "80–89",
  "90–100",
];

function confidenceBucket(confidence: number): string {
  if (confidence >= 90) return "90–100";
  if (confidence >= 80) return "80–89";
  if (confidence >= 70) return "70–79";
  if (confidence >= 60) return "60–69";
  return "<60";
}

function groupBreakdown(
  trades: TrackRecordTrade[],
  keyOf: (trade: TrackRecordTrade) => string
): TrackRecordGroupBreakdown[] {
  const map = new Map<
    string,
    { trades: number; wins: number; pnlSum: number }
  >();

  for (const trade of trades) {
    const key = keyOf(trade);
    const entry = map.get(key) ?? { trades: 0, wins: 0, pnlSum: 0 };

    entry.trades += 1;
    entry.wins += (trade.pnlPercent ?? 0) > 0 ? 1 : 0;
    entry.pnlSum += trade.pnlPercent ?? 0;

    map.set(key, entry);
  }

  return Array.from(map.entries()).map(([key, entry]) => ({
    key,
    trades: entry.trades,
    wins: entry.wins,
    winRate: (entry.wins / entry.trades) * 100,
    avgPnlPercent: entry.pnlSum / entry.trades,
  }));
}

export type TrackRecordSummary = {
  totalClosed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPnlPercent: number;
  bestTrade: TrackRecordTrade | null;
  worstTrade: TrackRecordTrade | null;
  closedTrades: TrackRecordTrade[];
  openPositions: TrackRecordTrade[];
  bySymbol: TrackRecordSymbolBreakdown[];
  bySignal: TrackRecordGroupBreakdown[];
  byConfidence: TrackRecordGroupBreakdown[];
};

function calculatePnlPercent(
  signal: "LONG" | "SHORT",
  entryPrice: number,
  exitPrice: number
): number {
  const rawChange =
    ((exitPrice - entryPrice) / entryPrice) * 100;

  return signal === "SHORT" ? -rawChange : rawChange;
}

type SnapshotResult =
  | { type: "open"; trade: TrackRecordTrade }
  | { type: "closed"; trade: TrackRecordTrade }
  | { type: "skip" };

async function resolveSnapshot(
  snapshot: Awaited<
    ReturnType<typeof prisma.signalSnapshot.findMany>
  >[number],
  allowRemoteFetch: boolean
): Promise<SnapshotResult> {
  const symbol = snapshot.symbol as MarketSymbol;
  const interval = snapshot.interval as BinanceInterval;
  const signal = snapshot.signal as "LONG" | "SHORT";
  const createdAtMs = snapshot.createdAt.getTime();
  const horizonAtMs = createdAtMs + HORIZON_MS;

  let entryPrice = snapshot.price;

  if (entryPrice == null && allowRemoteFetch) {
    entryPrice = await fetchHistoricalClosePrice(
      symbol,
      interval,
      createdAtMs
    );

    if (entryPrice != null) {
      await prisma.signalSnapshot.update({
        where: { id: snapshot.id },
        data: { price: entryPrice },
      });
    }
  }

  if (entryPrice == null) {
    return { type: "skip" };
  }

  if (Date.now() < horizonAtMs) {
    return {
      type: "open",
      trade: {
        id: snapshot.id,
        symbol,
        interval,
        signal,
        confidence: snapshot.confidence,
        entryPrice,
        createdAt: snapshot.createdAt.toISOString(),
        horizonAt: new Date(horizonAtMs).toISOString(),
        status: "OPEN",
        exitPrice: null,
        pnlPercent: null,
      },
    };
  }

  let exitPrice = snapshot.outcomePrice;

  if (exitPrice == null && allowRemoteFetch) {
    exitPrice = await fetchHistoricalClosePrice(
      symbol,
      interval,
      horizonAtMs
    );

    if (exitPrice != null) {
      await prisma.signalSnapshot.update({
        where: { id: snapshot.id },
        data: {
          outcomePrice: exitPrice,
          outcomeAt: new Date(horizonAtMs),
        },
      });
    }
  }

  if (exitPrice == null) {
    return { type: "skip" };
  }

  return {
    type: "closed",
    trade: {
      id: snapshot.id,
      symbol,
      interval,
      signal,
      confidence: snapshot.confidence,
      entryPrice,
      createdAt: snapshot.createdAt.toISOString(),
      horizonAt: new Date(horizonAtMs).toISOString(),
      status: "CLOSED",
      exitPrice,
      pnlPercent: calculatePnlPercent(
        signal,
        entryPrice,
        exitPrice
      ),
    },
  };
}

export async function getTrackRecord(options?: {
  /**
   * When true, missing entry/exit prices are back-filled from Binance
   * (a slow, network-bound operation) and persisted. This MUST stay
   * false on any user-facing render path — the anonymous landing page
   * was taking ~10s because it performed these historical fetches on
   * every visit. Background/cron jobs pass true to keep the DB filled.
   */
  allowRemoteFetch?: boolean;
}): Promise<TrackRecordSummary> {
  const allowRemoteFetch = options?.allowRemoteFetch ?? false;

  const snapshots = await prisma.signalSnapshot.findMany({
    where: {
      signal: { in: ["LONG", "SHORT"] },
    },
    orderBy: { createdAt: "asc" },
  });

  const results = await Promise.all(
    snapshots.map((snapshot) =>
      resolveSnapshot(snapshot, allowRemoteFetch)
    )
  );

  const closedTrades: TrackRecordTrade[] = [];
  const openPositions: TrackRecordTrade[] = [];

  for (const result of results) {
    if (result.type === "open") {
      openPositions.push(result.trade);
    } else if (result.type === "closed") {
      closedTrades.push(result.trade);
    }
  }

  const wins = closedTrades.filter(
    (trade) => (trade.pnlPercent ?? 0) > 0
  ).length;

  const totalClosed = closedTrades.length;

  const avgPnlPercent =
    totalClosed === 0
      ? 0
      : closedTrades.reduce(
          (sum, trade) => sum + (trade.pnlPercent ?? 0),
          0
        ) / totalClosed;

  const bestTrade = closedTrades.reduce<TrackRecordTrade | null>(
    (best, trade) =>
      !best ||
      (trade.pnlPercent ?? 0) > (best.pnlPercent ?? 0)
        ? trade
        : best,
    null
  );

  const worstTrade = closedTrades.reduce<TrackRecordTrade | null>(
    (worst, trade) =>
      !worst ||
      (trade.pnlPercent ?? 0) < (worst.pnlPercent ?? 0)
        ? trade
        : worst,
    null
  );

  const bySymbolMap = new Map<
    MarketSymbol,
    { trades: number; wins: number; pnlSum: number }
  >();

  for (const trade of closedTrades) {
    const entry = bySymbolMap.get(trade.symbol) ?? {
      trades: 0,
      wins: 0,
      pnlSum: 0,
    };

    entry.trades += 1;
    entry.wins += (trade.pnlPercent ?? 0) > 0 ? 1 : 0;
    entry.pnlSum += trade.pnlPercent ?? 0;

    bySymbolMap.set(trade.symbol, entry);
  }

  const bySymbol: TrackRecordSymbolBreakdown[] = Array.from(
    bySymbolMap.entries()
  )
    .map(([symbol, entry]) => ({
      symbol,
      trades: entry.trades,
      wins: entry.wins,
      winRate: (entry.wins / entry.trades) * 100,
      avgPnlPercent: entry.pnlSum / entry.trades,
    }))
    .sort((a, b) => b.trades - a.trades);

  const bySignal = groupBreakdown(
    closedTrades,
    (trade) => trade.signal
  ).sort((a, b) => b.trades - a.trades);

  const byConfidence = groupBreakdown(
    closedTrades,
    (trade) => confidenceBucket(trade.confidence)
  ).sort(
    (a, b) =>
      CONFIDENCE_BUCKET_ORDER.indexOf(a.key) -
      CONFIDENCE_BUCKET_ORDER.indexOf(b.key)
  );

  return {
    totalClosed,
    wins,
    losses: totalClosed - wins,
    winRate: totalClosed === 0 ? 0 : (wins / totalClosed) * 100,
    avgPnlPercent,
    bestTrade,
    worstTrade,
    closedTrades: closedTrades.slice().reverse(),
    openPositions: openPositions.slice().reverse(),
    bySymbol,
    bySignal,
    byConfidence,
  };
}

/**
 * Back-fills any missing entry/exit prices from Binance and persists
 * them, so the fetch-free render paths (landing page, track-record
 * page) stay complete. Safe to run from a cron/background job; never
 * from a user-facing request. Returns lightweight counters.
 */
export async function backfillTrackRecordOutcomes(): Promise<{
  totalClosed: number;
  openPositions: number;
}> {
  const summary = await getTrackRecord({ allowRemoteFetch: true });

  return {
    totalClosed: summary.totalClosed,
    openPositions: summary.openPositions.length,
  };
}
