import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { getWatchlists } from "@/lib/watchlists/queries";

export type WatchlistSignalCard = {
  symbol: MarketSymbol;
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  score: number;
  explanation: AtlasReasonCode;
};

// Cap so a large watchlist can't fan out into dozens of concurrent engine
// recomputes (and, for any watched stocks, blow Twelve Data's rate limit).
const MAX_BOARD_SYMBOLS = 12;

/**
 * Builds a live "signal board" for the user's watchlists: Atlas's CURRENT read
 * (signal, confidence, score, headline reason) for each distinct watched
 * symbol. Reuses the shared analysis cache so it piggybacks on the dashboard's
 * existing recompute rather than triggering a new one, and tolerates per-symbol
 * failures so one bad symbol never blanks the whole board.
 */
export async function getWatchlistSignalBoard(
  userId: string,
  limit = MAX_BOARD_SYMBOLS
): Promise<WatchlistSignalCard[]> {
  const watchlists = await getWatchlists(userId);

  const symbols: MarketSymbol[] = [];
  const seen = new Set<string>();

  for (const watchlist of watchlists) {
    for (const symbol of watchlist.symbols) {
      if (!seen.has(symbol)) {
        seen.add(symbol);
        symbols.push(symbol);
      }
    }
  }

  const bounded = symbols.slice(0, limit);

  const settled = await Promise.allSettled(
    bounded.map((symbol) => getCachedAtlasAnalysis(symbol))
  );

  const cards: WatchlistSignalCard[] = [];

  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      return;
    }

    const { decision } = result.value;

    cards.push({
      symbol: bounded[index],
      signal: decision.signal,
      confidence: decision.confidence,
      score: decision.score,
      explanation: decision.explanation,
    });
  });

  // Most actionable first: directional calls (LONG/SHORT) ahead of WAITs,
  // each ordered by confidence.
  return cards.sort((first, second) => {
    const firstDirectional = first.signal === "WAIT" ? 0 : 1;
    const secondDirectional = second.signal === "WAIT" ? 0 : 1;

    if (firstDirectional !== secondDirectional) {
      return secondDirectional - firstDirectional;
    }

    return second.confidence - first.confidence;
  });
}
