import crypto from "crypto";

import type { BinanceBalance } from "@/lib/exchange/binance";

const BASE_URL = "https://api.bybit.com";
const REQUEST_TIMEOUT_MS = 10_000;
const RECV_WINDOW = "60000";

type BybitResponse = {
  retCode: number;
  retMsg: string;
  result?: {
    list?: Array<{
      coin?: Array<{ coin: string; walletBalance: string }>;
    }>;
  };
};

async function fetchWallet(
  apiKey: string,
  secret: string,
  accountType: "UNIFIED" | "SPOT"
): Promise<BybitResponse> {
  const timestamp = Date.now().toString();
  const query = `accountType=${accountType}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp + apiKey + RECV_WINDOW + query)
    .digest("hex");

  const response = await fetch(
    `${BASE_URL}/v5/account/wallet-balance?${query}`,
    {
      headers: {
        "X-BAPI-API-KEY": apiKey,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": RECV_WINDOW,
        "X-BAPI-SIGN": signature,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(`Bybit HTTP ${response.status}`);
  }

  return (await response.json()) as BybitResponse;
}

/** Read-only wallet balances from Bybit (v5). Tries UNIFIED, then SPOT. */
export async function fetchBybitAccount(
  apiKey: string,
  secret: string
): Promise<BinanceBalance[]> {
  let data = await fetchWallet(apiKey, secret, "UNIFIED");

  if (data.retCode !== 0) {
    data = await fetchWallet(apiKey, secret, "SPOT");
  }

  if (data.retCode !== 0) {
    throw new Error(`Bybit error ${data.retCode}: ${data.retMsg}`);
  }

  const balances: BinanceBalance[] = [];
  for (const account of data.result?.list ?? []) {
    for (const coin of account.coin ?? []) {
      const total = Number(coin.walletBalance);
      if (Number.isFinite(total) && total > 0) {
        balances.push({ asset: coin.coin, free: total, locked: 0 });
      }
    }
  }

  return balances;
}

export async function verifyBybitKey(
  apiKey: string,
  secret: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await fetchBybitAccount(apiKey, secret);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
