import { MARKET_SYMBOLS as ATLAS_MARKET_SYMBOLS } from "@/lib/config/markets";

export const MARKET_SYMBOLS = ATLAS_MARKET_SYMBOLS;

export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

export const WATCHLIST_FAVORITES_STORAGE_KEY =
  "genwelth-watchlist-favorites";

export type LiveMarketItem = {
  symbol: MarketSymbol;
  price: number;
  change24h: number;
  volume24h: number;
};

type BinanceTickerResponse = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

function isMarketSymbol(symbol: string): symbol is MarketSymbol {
  return MARKET_SYMBOLS.some(
    (marketSymbol) => marketSymbol === symbol
  );
}

function parseNumber(value: string, fieldName: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Invalid ${fieldName} received from market API`);
  }

  return parsedValue;
}

async function fetchMarketSymbol(
  symbol: MarketSymbol,
  signal?: AbortSignal
): Promise<LiveMarketItem> {
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    {
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Could not load ${symbol}. Status: ${response.status}`
    );
  }

  const data = (await response.json()) as BinanceTickerResponse;

  if (!isMarketSymbol(data.symbol)) {
    throw new Error(`Unexpected symbol received: ${data.symbol}`);
  }

  return {
    symbol: data.symbol,
    price: parseNumber(data.lastPrice, `${symbol} price`),
    change24h: parseNumber(
      data.priceChangePercent,
      `${symbol} 24h change`
    ),
    volume24h: parseNumber(
      data.quoteVolume,
      `${symbol} 24h volume`
    ),
  };
}

export async function fetchLiveMarketData(
  symbols: readonly MarketSymbol[] = MARKET_SYMBOLS,
  signal?: AbortSignal
): Promise<LiveMarketItem[]> {
  return Promise.all(
    symbols.map((symbol) => fetchMarketSymbol(symbol, signal))
  );
}

export function formatMarketSymbol(symbol: MarketSymbol) {
  return symbol.replace("USDT", "");
}

export function formatMarketPrice(price: number) {
  if (price >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  if (price >= 1) {
    return price.toFixed(2);
  }

  return price.toFixed(4);
}