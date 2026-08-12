import crypto from "crypto";

const BASE_URL = "https://api.binance.com";
const REQUEST_TIMEOUT_MS = 10_000;

export type BinanceBalance = {
  asset: string;
  free: number;
  locked: number;
};

function sign(query: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

/**
 * Reads the account's balances via the SIGNED /api/v3/account endpoint. This
 * only ever READS — it never places orders or withdraws. Non-zero balances
 * only.
 */
export async function fetchBinanceAccount(
  apiKey: string,
  secret: string
): Promise<BinanceBalance[]> {
  const query = `recvWindow=60000&timestamp=${Date.now()}`;
  const signature = sign(query, secret);

  const response = await fetch(
    `${BASE_URL}/api/v3/account?${query}&signature=${signature}`,
    {
      headers: { "X-MBX-APIKEY": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Binance account error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    balances?: Array<{ asset: string; free: string; locked: string }>;
  };

  return (data.balances ?? [])
    .map((entry) => ({
      asset: entry.asset,
      free: Number(entry.free),
      locked: Number(entry.locked),
    }))
    .filter((entry) => entry.free + entry.locked > 0);
}

/** Confirms the key works (and is at least readable). Returns a friendly error. */
export async function verifyBinanceKey(
  apiKey: string,
  secret: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await fetchBinanceAccount(apiKey, secret);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/** Public ticker prices (no auth) — used to value balances in USDT. */
export async function fetchBinancePrices(): Promise<Map<string, number>> {
  const response = await fetch(`${BASE_URL}/api/v3/ticker/price`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    return new Map();
  }

  const data = (await response.json()) as Array<{
    symbol: string;
    price: string;
  }>;

  const map = new Map<string, number>();
  for (const entry of data) {
    map.set(entry.symbol, Number(entry.price));
  }
  return map;
}
