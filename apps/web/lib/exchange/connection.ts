import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import { MARKET_SYMBOLS } from "@/lib/config/markets";
import { decryptSecret, isSecretBoxConfigured } from "@/lib/crypto/secretBox";
import { prisma } from "@/lib/db/client";
import { fetchBinanceTickers } from "@/lib/exchange/binance";
import { fetchExchangeBalances } from "@/lib/exchange/registry";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

const CURATED = new Set<string>(MARKET_SYMBOLS as readonly string[]);
const MAX_SIGNAL_LOOKUPS = 12;

const STABLES = new Set([
  "USDT",
  "USDC",
  "BUSD",
  "FDUSD",
  "TUSD",
  "DAI",
]);

/** The feature is available only when the encryption key is set. */
export function isExchangeConfigured(): boolean {
  return isSecretBoxConfigured();
}

export type ExchangeConnectionView = {
  exchange: string;
  createdAt: string;
};

export async function getExchangeConnection(
  userId: string
): Promise<ExchangeConnectionView | null> {
  let conn;
  try {
    conn = await prisma.exchangeConnection.findUnique({
      where: { userId },
    });
  } catch (error) {
    // A missing table or transient DB error must never take down the
    // whole settings page — degrade to "no connection".
    console.error("getExchangeConnection failed:", error);
    return null;
  }

  if (!conn) {
    return null;
  }

  return {
    exchange: conn.exchange,
    createdAt: conn.createdAt.toISOString(),
  };
}

export type ExchangeHolding = {
  asset: string;
  amount: number;
  usdValue: number | null;
  change24h: number | null;
  atlasSignal: {
    signal: "LONG" | "SHORT" | "WAIT";
    confidence: number;
  } | null;
};

export type ExchangeHoldingsResult =
  | { connected: false }
  | { connected: true; exchange: string; error: string }
  | {
      connected: true;
      exchange: string;
      holdings: ExchangeHolding[];
      totalUsd: number;
      change24hPct: number | null;
    };

/**
 * Reads the user's live balances from their connected exchange (read-only),
 * valued in USDT. Never trades or withdraws.
 */
export async function getExchangeHoldings(
  userId: string,
  options: { withSignals?: boolean } = {}
): Promise<ExchangeHoldingsResult> {
  let conn;
  try {
    conn = await prisma.exchangeConnection.findUnique({
      where: { userId },
    });
  } catch (error) {
    console.error("getExchangeHoldings connection lookup failed:", error);
    return { connected: false };
  }

  if (!conn) {
    return { connected: false };
  }

  try {
    const secret = decryptSecret(conn.secretCipher);
    const [balances, tickers] = await Promise.all([
      fetchExchangeBalances(conn.exchange, conn.apiKey, secret),
      fetchBinanceTickers(),
    ]);

    const tickerOf = (
      asset: string
    ): { price: number; change24h: number } | null => {
      if (STABLES.has(asset)) {
        return { price: 1, change24h: 0 };
      }
      const ticker = tickers.get(`${asset}USDT`);
      return ticker && Number.isFinite(ticker.price) ? ticker : null;
    };

    let totalUsd = 0;
    let value24hAgo = 0;

    const holdings: ExchangeHolding[] = balances
      .map((balance) => {
        const amount = balance.free + balance.locked;
        const ticker = tickerOf(balance.asset);
        const usdValue = ticker ? amount * ticker.price : null;
        const change24h = ticker ? ticker.change24h : null;

        if (usdValue != null) {
          totalUsd += usdValue;
          value24hAgo +=
            change24h != null
              ? usdValue / (1 + change24h / 100)
              : usdValue;
        }

        return {
          asset: balance.asset,
          amount,
          usdValue,
          change24h,
          atlasSignal: null as ExchangeHolding["atlasSignal"],
        };
      })
      .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

    const change24hPct =
      value24hAgo > 0
        ? ((totalUsd - value24hAgo) / value24hAgo) * 100
        : null;

    // Attach Atlas's current signal to the top holdings that map to a curated
    // pair — so the real portfolio shows what Atlas thinks of each coin.
    if (options.withSignals) {
      await Promise.all(
        holdings.slice(0, MAX_SIGNAL_LOOKUPS).map(async (holding) => {
          const pair = `${holding.asset}USDT`;
          if (!CURATED.has(pair)) {
            return;
          }
          try {
            const analysis = await getCachedAtlasAnalysis(
              pair as MarketSymbol
            );
            holding.atlasSignal = {
              signal: analysis.decision.signal,
              confidence: analysis.decision.confidence,
            };
          } catch {
            // leave null on failure
          }
        })
      );
    }

    return {
      connected: true,
      exchange: conn.exchange,
      holdings,
      totalUsd,
      change24hPct,
    };
  } catch (error) {
    console.error("Exchange holdings fetch failed:", error);
    return {
      connected: true,
      exchange: conn.exchange,
      error: (error as Error).message,
    };
  }
}
