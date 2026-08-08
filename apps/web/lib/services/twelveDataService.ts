import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";

// Curated set of major US stocks Atlas covers. Kept bounded (not "every
// ticker") to stay within Twelve Data's free-tier rate limits and to mirror
// the curated crypto MARKET_SYMBOLS approach.
export const STOCK_SYMBOLS = [
  "TSLA",
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "AMD",
  "NFLX",
  "INTC",
  "DIS",
  "BA",
  "JPM",
  "V",
  "KO",
  "PYPL",
  "UBER",
  "COIN",
  "PLTR",
  "MSTR",
  "MARA",
  "SOFI",
  "SHOP",
  "BABA",
] as const;

const STOCK_SET = new Set<string>(STOCK_SYMBOLS);

// Common company names → ticker, so users can type "Tesla" not just "TSLA".
const STOCK_ALIASES: Record<string, string> = {
  TESLA: "TSLA",
  APPLE: "AAPL",
  MICROSOFT: "MSFT",
  NVIDIA: "NVDA",
  AMAZON: "AMZN",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  FACEBOOK: "META",
  NETFLIX: "NFLX",
  INTEL: "INTC",
  DISNEY: "DIS",
  BOEING: "BA",
  VISA: "V",
  PAYPAL: "PYPL",
  COINBASE: "COIN",
  PALANTIR: "PLTR",
  MICROSTRATEGY: "MSTR",
  MARATHON: "MARA",
  SHOPIFY: "SHOP",
  ALIBABA: "BABA",
};

export function isStockSymbol(symbol: string): boolean {
  return STOCK_SET.has(symbol.toUpperCase());
}

/**
 * Resolves a user-typed token to a canonical stock ticker — accepts the
 * ticker itself (TSLA) or a common company name (Tesla). Returns null if it's
 * not a known stock.
 */
export function resolveStockSymbol(token: string): string | null {
  const upper = token.toUpperCase();

  if (STOCK_SET.has(upper)) {
    return upper;
  }

  return STOCK_ALIASES[upper] ?? null;
}

export function isStocksConfigured(): boolean {
  return Boolean(process.env.TWELVEDATA_API_KEY);
}

// Map the engine's (Binance-flavored) interval names to Twelve Data's.
const INTERVAL_MAP: Record<BinanceInterval, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

const BASE_URL = "https://api.twelvedata.com";
const REQUEST_TIMEOUT_MS = 10_000;

type TwelveDataValue = {
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type TwelveDataTimeSeries = {
  status?: string;
  message?: string;
  values?: TwelveDataValue[];
};

/**
 * Fetches stock OHLCV candles from Twelve Data in the SAME `AtlasCandle`
 * shape the engine already consumes for crypto — oldest-first, so the
 * indicators/SMC engines run unchanged.
 */
export async function fetchStockCandles(
  symbol: string,
  interval: BinanceInterval = "1h",
  limit = 100
): Promise<AtlasCandle[]> {
  const apiKey = process.env.TWELVEDATA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Stock data is not configured (TWELVEDATA_API_KEY missing)."
    );
  }

  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval: INTERVAL_MAP[interval],
    outputsize: String(Math.min(Math.max(limit, 50), 5000)),
    order: "ASC",
    apikey: apiKey,
  });

  const response = await fetch(
    `${BASE_URL}/time_series?${params.toString()}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock candles: ${response.status}`
    );
  }

  const data = (await response.json()) as TwelveDataTimeSeries;

  if (data.status === "error" || !Array.isArray(data.values)) {
    throw new Error(
      `Twelve Data error for ${symbol}: ${data.message ?? "no data"}`
    );
  }

  return data.values.map((value) => ({
    open: Number(value.open),
    high: Number(value.high),
    low: Number(value.low),
    close: Number(value.close),
    volume: Number(value.volume ?? 0),
  }));
}

export type StockQuote = {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
};

/**
 * Searches the curated stock universe by ticker or company name — for the
 * coin/asset search box. Returns `{symbol, base}` matching the crypto search
 * shape so the UI treats results uniformly.
 */
export function searchStocks(
  query: string,
  limit = 4
): Array<{ symbol: string; base: string }> {
  const q = query.trim().toUpperCase();

  if (!q) {
    return [];
  }

  const seen = new Set<string>();
  const results: Array<{ symbol: string; base: string }> = [];

  for (const ticker of STOCK_SYMBOLS) {
    if (ticker.includes(q) && !seen.has(ticker)) {
      seen.add(ticker);
      results.push({ symbol: ticker, base: ticker });
    }
  }

  for (const [name, ticker] of Object.entries(STOCK_ALIASES)) {
    if (name.includes(q) && !seen.has(ticker)) {
      seen.add(ticker);
      results.push({ symbol: ticker, base: ticker });
    }
  }

  return results.slice(0, limit);
}

/**
 * Live-ish stock quote (last price + session % change). Returns null when
 * stocks aren't configured or the symbol isn't recognized, so callers can
 * degrade gracefully.
 */
export async function fetchStockQuote(
  symbol: string
): Promise<StockQuote | null> {
  const apiKey = process.env.TWELVEDATA_API_KEY;

  if (!apiKey) {
    return null;
  }

  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    apikey: apiKey,
  });

  const response = await fetch(
    `${BASE_URL}/quote?${params.toString()}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    status?: string;
    close?: string;
    percent_change?: string;
    volume?: string;
  };

  if (data.status === "error" || data.close == null) {
    return null;
  }

  const price = Number(data.close);

  if (!Number.isFinite(price)) {
    return null;
  }

  return {
    symbol: symbol.toUpperCase(),
    price,
    change24h: Number(data.percent_change ?? 0),
    volume24h: Number(data.volume ?? 0),
  };
}
