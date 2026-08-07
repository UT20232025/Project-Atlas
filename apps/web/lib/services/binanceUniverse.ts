export type CoinUniverseItem = {
  symbol: string;
  base: string;
};

type BinanceExchangeInfo = {
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    isSpotTradingAllowed: boolean;
  }>;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — the pair list rarely changes.

let cache: { expiresAt: number; items: CoinUniverseItem[] } | null =
  null;
let inFlight: Promise<CoinUniverseItem[]> | null = null;

async function fetchUniverse(): Promise<CoinUniverseItem[]> {
  const response = await fetch(
    "https://api.binance.com/api/v3/exchangeInfo",
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      `Could not load Binance exchange info. Status: ${response.status}`
    );
  }

  const data = (await response.json()) as BinanceExchangeInfo;

  return data.symbols
    .filter(
      (item) =>
        item.quoteAsset === "USDT" &&
        item.status === "TRADING" &&
        item.isSpotTradingAllowed
    )
    .map((item) => ({
      symbol: item.symbol,
      base: item.baseAsset,
    }))
    .sort((a, b) => a.base.localeCompare(b.base));
}

/**
 * Returns every tradable USDT spot pair on Binance (the searchable
 * universe), cached in-memory for 6h. Concurrent callers share one
 * in-flight request.
 */
export async function getCoinUniverse(): Promise<CoinUniverseItem[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.items;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = fetchUniverse()
    .then((items) => {
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, items };
      return items;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Filters the universe by a free-text query against symbol or base
 * asset, ranking exact/prefix matches first. Returns at most `limit`.
 */
export async function searchCoins(
  query: string,
  limit = 8
): Promise<CoinUniverseItem[]> {
  const universe = await getCoinUniverse();
  const q = query.trim().toUpperCase();

  if (!q) {
    return [];
  }

  const scored = universe
    .map((item) => {
      const base = item.base.toUpperCase();
      let score = -1;

      if (base === q) {
        score = 0;
      } else if (base.startsWith(q)) {
        score = 1;
      } else if (base.includes(q)) {
        score = 2;
      } else if (item.symbol.toUpperCase().includes(q)) {
        score = 3;
      }

      return { item, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.item.base.localeCompare(b.item.base)
    )
    .slice(0, limit)
    .map((entry) => entry.item);

  return scored;
}
