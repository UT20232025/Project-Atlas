import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import { prisma } from "@/lib/db/client";
import { sendPushToUser } from "@/lib/push/webPush";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { getPositionGuidance } from "@/lib/trading/positionGuidance";

// Judge open positions on the daily signal — a "the market turned on your
// hold" alert should track the higher-timeframe trend, not intraday noise.
const WATCH_INTERVAL = "1d" as const;

/**
 * Checks every open position and pushes an EXIT alert to its owner the moment
 * Atlas flips against it. State (lastVerdict) lives on the Position row so an
 * alert fires only on the flip, and the first observation just sets a
 * baseline (no alert storm on rollout). Safe to run from a cron.
 */
export async function watchOpenPositions(): Promise<{
  checked: number;
  alerted: number;
}> {
  const positions = await prisma.position.findMany({
    where: { userId: { not: null } },
  });

  const symbols = Array.from(
    new Set(positions.map((position) => position.symbol))
  );

  const signalBySymbol = new Map<string, "LONG" | "SHORT" | "WAIT">();

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const analysis = await getCachedAtlasAnalysis(
        symbol as MarketSymbol,
        WATCH_INTERVAL
      );
      signalBySymbol.set(symbol, analysis.decision.signal);
    })
  );

  let alerted = 0;

  for (const position of positions) {
    const signal = signalBySymbol.get(position.symbol);
    if (!signal) continue;

    const direction = position.direction === "SHORT" ? "SHORT" : "LONG";
    const verdict = getPositionGuidance({
      direction,
      atlasSignal: signal,
      pnlPercent: null,
    }).verdict;

    if (verdict === position.lastVerdict) continue;

    // Alert only on a fresh flip into EXIT; never on the first observation
    // (lastVerdict null just initialises the baseline).
    if (
      position.lastVerdict != null &&
      verdict === "EXIT" &&
      position.userId
    ) {
      const display = position.symbol.replace(/USDT$/, "");

      await sendPushToUser(position.userId, {
        title: `⚠️ EXIT — ${display}`,
        body: `Atlas flipped to ${signal}. The market turned against your ${direction}. Consider closing.`,
        url: "/portfolio",
        tag: `position-exit-${position.id}`,
      });

      alerted += 1;
    }

    await prisma.position.update({
      where: { id: position.id },
      data: { lastVerdict: verdict },
    });
  }

  return { checked: positions.length, alerted };
}
