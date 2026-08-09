import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { fetchMarketCandles } from "@/lib/services/marketCandles";

export type PreviousDayLevels = {
  pdh: number | null;
  pdl: number | null;
};

const EMPTY: PreviousDayLevels = { pdh: null, pdl: null };

/**
 * Previous Day High / Low — the high and low of the last COMPLETED daily
 * candle. Daily candles are oldest-first, so the final entry is today's
 * in-progress bar and the one before it is the previous day. Works for both
 * crypto and stocks via the shared candle router. Tolerant of failures so a
 * missing feed just yields no levels rather than breaking the page.
 */
export async function getPreviousDayLevels(
  symbol: MarketSymbol
): Promise<PreviousDayLevels> {
  try {
    const candles = await fetchMarketCandles(symbol, "1d", 3);

    if (candles.length < 2) {
      return EMPTY;
    }

    const previous = candles[candles.length - 2];

    return {
      pdh: Number.isFinite(previous.high) ? previous.high : null,
      pdl: Number.isFinite(previous.low) ? previous.low : null,
    };
  } catch {
    return EMPTY;
  }
}
