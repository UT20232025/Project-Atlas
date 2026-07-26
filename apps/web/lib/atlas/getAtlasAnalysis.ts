import {
  analyzeMarket,
  type AtlasAnalysis,
} from "@/lib/atlas/atlasEngine";
import {
  calculateAtlasIndicators,
  type AtlasIndicatorResult,
} from "@/lib/atlas/atlasIndicators";
import {
  calculateSupportResistance,
  type AtlasPriceLevels,
} from "@/lib/atlas/supportResistance";
import {
  applyTrendFilter,
  type AtlasTrendFilterResult,
} from "@/lib/atlas/trendFilter";
import { createTradeSetup } from "@/lib/atlas/tradeSetup";
import {
  fetchBinanceCandles,
  type BinanceInterval,
} from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

export type AtlasAnalysisResponse = {
  analysis: AtlasAnalysis;
  indicators: AtlasIndicatorResult;
  trendFilter: AtlasTrendFilterResult;
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
    250
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

  const trendFilter =
    applyTrendFilter({
      signal: analysis.signal,
      confidence: analysis.confidence,
      risk: analysis.risk,
      trendStatus: indicators.trendStatus,
    });

  const priceLevels =
    calculateSupportResistance(candles);

  const tradeSetup =
    createTradeSetup({
      candles,
      signal: trendFilter.signal,
      confidence: trendFilter.confidence,
      risk: trendFilter.risk,
      priceLevels,
    });

  return {
    analysis,
    indicators,
    trendFilter,
    priceLevels,
    tradeSetup,
  };
}