import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";
import {
  fetchBinanceCandles,
  type BinanceInterval,
} from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import {
  fetchStockCandles,
  isTwelveDataSymbol,
} from "@/lib/services/twelveDataService";

/**
 * Single candle source the Atlas engine calls — routes stocks, gold and FX to
 * Twelve Data and everything else to Binance. Both return `AtlasCandle[]`
 * in the same shape, so the engine is asset-agnostic.
 */
export function fetchMarketCandles(
  symbol: string,
  interval: BinanceInterval = "1h",
  limit = 100
): Promise<AtlasCandle[]> {
  if (isTwelveDataSymbol(symbol)) {
    return fetchStockCandles(symbol, interval, limit);
  }

  return fetchBinanceCandles(
    symbol as MarketSymbol,
    interval,
    limit
  );
}
