export type SignalType = "LONG" | "SHORT" | "WAIT";

export type TrendType = "BULLISH" | "BEARISH" | "NEUTRAL";

export type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

export type MarketTicker = {
  coin: string;
  price: string;
  change: string;
  volume: string;
};

export type TechnicalIndicators = {
  rsi: number;
  ema20: number;
  ema50: number;
  trend: TrendType;
};

export type TopMover = {
  coin: string;
  price: string;
  change: string;
};