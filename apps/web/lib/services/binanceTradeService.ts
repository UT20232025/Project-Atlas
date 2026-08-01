import type { MarketSymbol } from "@/lib/services/liveMarketService";

export type BinanceAggTrade = {
  price: number;
  quantity: number;
  quoteQuantity: number;
  isBuyerMaker: boolean;
  time: number;
};

type RawAggTrade = {
  p: string;
  q: string;
  T: number;
  m: boolean;
};

const BINANCE_AGG_TRADES_URL =
  "https://api.binance.com/api/v3/aggTrades";

export async function fetchRecentTrades(
  symbol: MarketSymbol,
  limit = 1000
): Promise<BinanceAggTrade[]> {
  const searchParams = new URLSearchParams({
    symbol,
    limit: Math.min(Math.max(limit, 50), 1000).toString(),
  });

  const response = await fetch(
    `${BINANCE_AGG_TRADES_URL}?${searchParams.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Binance trades: ${response.status}`
    );
  }

  const data = (await response.json()) as RawAggTrade[];

  if (!Array.isArray(data)) {
    throw new Error(
      "Invalid trade data received from Binance."
    );
  }

  return data.map((trade) => {
    const price = Number(trade.p);
    const quantity = Number(trade.q);

    return {
      price,
      quantity,
      quoteQuantity: price * quantity,
      isBuyerMaker: trade.m,
      time: trade.T,
    };
  });
}
