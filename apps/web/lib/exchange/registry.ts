import {
  fetchBinanceAccount,
  verifyBinanceKey,
  type BinanceBalance,
} from "@/lib/exchange/binance";
import { fetchBybitAccount, verifyBybitKey } from "@/lib/exchange/bybit";
import {
  fetchCoinbaseAccount,
  verifyCoinbaseKey,
} from "@/lib/exchange/coinbase";

export const SUPPORTED_EXCHANGES = [
  "binance",
  "bybit",
  "coinbase",
] as const;
export type ExchangeId = (typeof SUPPORTED_EXCHANGES)[number];

export const EXCHANGE_LABELS: Record<ExchangeId, string> = {
  binance: "Binance",
  bybit: "Bybit",
  coinbase: "Coinbase",
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
  if (exchange === "bybit") return verifyBybitKey(apiKey, secret);
  if (exchange === "coinbase") return verifyCoinbaseKey(apiKey, secret);
  return verifyBinanceKey(apiKey, secret);
}

export async function fetchExchangeBalances(
  exchange: string,
  apiKey: string,
  secret: string
): Promise<BinanceBalance[]> {
  if (exchange === "bybit") return fetchBybitAccount(apiKey, secret);
  if (exchange === "coinbase")
    return fetchCoinbaseAccount(apiKey, secret);
  return fetchBinanceAccount(apiKey, secret);
}
