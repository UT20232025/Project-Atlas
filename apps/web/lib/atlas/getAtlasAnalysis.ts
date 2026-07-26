import {
  analyzeMarket,
  type AtlasAnalysis,
} from "@/lib/atlas/atlasEngine";
import { calculateAtlasIndicators } from "@/lib/atlas/atlasIndicators";
import {
  calculateSupportResistance,
  type AtlasPriceLevels,
} from "@/lib/atlas/supportResistance";
import { createTradeSetup } from "@/lib/atlas/tradeSetup";
import {
  fetchBinanceCandles,
  type BinanceInterval,
} from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

export type AtlasAnalysisResponse = {
  analysis: AtlasAnalysis;
  priceLevels: AtlasPriceLevels;
  tradeSetup: ReturnType<typeof createTradeSetup>;
};

export async function getAtlasAnalysis(
  symbol: MarketSymbol,
  interval: BinanceInterval = "1h"
): Promise<AtlasAnalysisResponse> {
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

  const indicators =
    calculateAtlasIndicators(candles);

  const analysis =
    analyzeMarket(indicators);

  const priceLevels =
    calculateSupportResistance(candles);

  const tradeSetup =
    createTradeSetup({
      candles,
      signal: analysis.signal,
      confidence: analysis.confidence,
      risk: analysis.risk,
      priceLevels,
    });

  return {
    analysis,
    priceLevels,
    tradeSetup,
  };
}