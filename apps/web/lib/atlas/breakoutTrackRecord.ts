import { fetchHistoricalClosePrice } from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import type { BreakoutResult } from "@/lib/atlas/breakoutEngine";
import { prisma } from "@/lib/db/client";

const HORIZON_MS = 24 * 60 * 60 * 1000;

// Record a breakout we broadcast, so its 24h outcome can be measured. Caller
// gates this on the same debounce/strength as the broadcast, so one row = one
// signal actually sent.
export async function recordBreakout(
  symbol: string,
  breakout: BreakoutResult
): Promise<void> {
  if (
    !breakout.detected ||
    breakout.direction === null ||
    breakout.entry == null
  ) {
    return;
  }

  try {
    await prisma.breakoutSignal.create({
      data: {
        symbol,
        direction: breakout.direction,
        strength: breakout.strength,
        entryPrice: breakout.entry,
        stopLoss: breakout.stopLoss,
        takeProfit: breakout.takeProfit,
      },
    });
  } catch (error) {
    console.error("Failed to record breakout signal:", error);
  }
}

// Fills the 24h outcome for breakouts old enough to resolve. Called by the
// resolve-outcomes cron alongside the conservative backfill.
export async function resolveBreakoutOutcomes(): Promise<{
  breakoutsResolved: number;
}> {
  const cutoff = new Date(Date.now() - HORIZON_MS);

  const pending = await prisma.breakoutSignal.findMany({
    where: { outcomePrice: null, createdAt: { lt: cutoff } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  let breakoutsResolved = 0;

  for (const signal of pending) {
    const at = signal.createdAt.getTime() + HORIZON_MS;
    const price = await fetchHistoricalClosePrice(
      signal.symbol as MarketSymbol,
      "1h",
      at
    );
    if (price == null) continue;

    await prisma.breakoutSignal.update({
      where: { id: signal.id },
      data: { outcomePrice: price, outcomeAt: new Date(at) },
    });
    breakoutsResolved += 1;
  }

  return { breakoutsResolved };
}

export type BreakoutTrackRecord = {
  total: number;
  wins: number;
  winRate: number;
  long: { total: number; wins: number; winRate: number };
  short: { total: number; wins: number; winRate: number };
};

function isWin(direction: string, entry: number, outcome: number): boolean {
  return direction === "LONG" ? outcome > entry : outcome < entry;
}

// Win rate over resolved breakouts — the honest "do our momentum signals work"
// number, computed the same 24h-outcome way as the conservative track record.
export async function getBreakoutTrackRecord(): Promise<BreakoutTrackRecord> {
  const rows = await prisma.breakoutSignal.findMany({
    where: { outcomePrice: { not: null } },
    select: { direction: true, entryPrice: true, outcomePrice: true },
  });

  const tally = {
    total: 0,
    wins: 0,
    long: { total: 0, wins: 0 },
    short: { total: 0, wins: 0 },
  };

  for (const row of rows) {
    if (row.outcomePrice == null) continue;
    const win = isWin(row.direction, row.entryPrice, row.outcomePrice);
    tally.total += 1;
    if (win) tally.wins += 1;
    const bucket = row.direction === "LONG" ? tally.long : tally.short;
    bucket.total += 1;
    if (win) bucket.wins += 1;
  }

  const rate = (w: number, t: number) => (t === 0 ? 0 : (w / t) * 100);

  return {
    total: tally.total,
    wins: tally.wins,
    winRate: rate(tally.wins, tally.total),
    long: {
      total: tally.long.total,
      wins: tally.long.wins,
      winRate: rate(tally.long.wins, tally.long.total),
    },
    short: {
      total: tally.short.total,
      wins: tally.short.wins,
      winRate: rate(tally.short.wins, tally.short.total),
    },
  };
}
