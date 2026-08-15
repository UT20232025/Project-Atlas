import type { BinanceInterval } from "@/lib/services/binanceCandleService";

// The customer's trading style: a marathon (multi-day swings) vs a sprint
// (intraday day-trades). It's the top-level lens Atlas is viewed through —
// it sets the default analysis timeframe and framing across the app.
//
// This module is client-safe (no next/headers). The server-only cookie
// reader lives in ./getTradingStyle.

export type TradingStyle = "swing" | "intraday";

export const TRADING_STYLE_COOKIE = "atlas_style";

export const DEFAULT_TRADING_STYLE: TradingStyle = "intraday";

// The candle timeframe each style analyses by default (until the user picks
// an explicit timeframe on a page).
export const STYLE_TIMEFRAME: Record<TradingStyle, BinanceInterval> = {
  swing: "1d",
  intraday: "1h",
};

export function isTradingStyle(value: unknown): value is TradingStyle {
  return value === "swing" || value === "intraday";
}
