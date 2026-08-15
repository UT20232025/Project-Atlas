import { cookies } from "next/headers";

import {
  DEFAULT_TRADING_STYLE,
  isTradingStyle,
  TRADING_STYLE_COOKIE,
  type TradingStyle,
} from "@/lib/preferences/tradingStyle";

// Server-only: reads the trading-style preference from its cookie.
export async function getTradingStyle(): Promise<TradingStyle> {
  const store = await cookies();
  const value = store.get(TRADING_STYLE_COOKIE)?.value;

  return isTradingStyle(value) ? value : DEFAULT_TRADING_STYLE;
}
