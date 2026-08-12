import {
  fetchBinanceAccount,
  verifyBinanceKey,
  type BinanceBalance,
} from "@/lib/exchange/binance";
import { fetchBybitAccount, verifyBybitKey } from "@/lib/exchange/bybit";

export const SUPPORTED_EXCHANGES = ["binance", "bybit"] as const;
export type ExchangeId = (typeof SUPPORTED_EXCHANGES)[number];

export const EXCHANGE_LABELS: Record<ExchangeId, string> = {
  binance: "Binance",
  bybit: "Bybit",
};

export function isSupportedExchange(value: string): value is ExchangeId {
  return (SUPPORTED_EXCHANGES as readonly string[]).includes(value);
}

export function exchangeLabel(exchange: string): string {
  return isSupportedExchange(exchange)
    ? EXCHANGE_LABELS[exchange]
    : exchange;
}

export async function verifyExchangeKey(
  exchange: ExchangeId,
  apiKey: string,
  secret: string
): Promise<{ ok: boolean; error?: string }> {
  return exchange === "bybit"
    ? verifyBybitKey(apiKey, secret)
    : verifyBinanceKey(apiKey, secret);
}

export async function fetchExchangeBalances(
  exchange: string,
  apiKey: string,
  secret: string
): Promise<BinanceBalance[]> {
  return exchange === "bybit"
    ? fetchBybitAccount(apiKey, secret)
    : fetchBinanceAccount(apiKey, secret);
}
