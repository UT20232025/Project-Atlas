import {
  analyzeMarket,
  type AtlasAnalysis,
} from "@/lib/atlas/atlasEngine";
import { calculateAtlasIndicators } from "@/lib/atlas/atlasIndicators";
import {
  fetchBinanceCandles,
  type BinanceInterval,
} from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

export async function getAtlasAnalysis(
  symbol: MarketSymbol,
  interval: BinanceInterval = "1h"
): Promise<AtlasAnalysis> {
  const candles = await fetchBinanceCandles(
    symbol,
    interval,
    100
  );

  if (candles.length < 50) {
    throw new Error(
      `Not enough candle data to analyze ${symbol}.`
    );
  }

  const indicators = calculateAtlasIndicators(candles);

  return analyzeMarket(indicators);
}