import crypto from "crypto";

import type { BinanceBalance } from "@/lib/exchange/binance";

// Coinbase Advanced Trade (CDP / Cloud keys). Auth is a per-request ES256 JWT
// signed with the account's EC private key. Read-only: we only GET accounts.
const HOST = "api.coinbase.com";
const PATH = "/api/v3/brokerage/accounts";
const REQUEST_TIMEOUT_MS = 10_000;

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function buildJwt(keyName: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "ES256",
    kid: keyName,
    nonce: crypto.randomBytes(16).toString("hex"),
    typ: "JWT",
  };
  const payload = {
    sub: keyName,
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    uri: `GET ${HOST}${PATH}`,
  };

  const signingInput = `${base64url(
    JSON.stringify(header)
  )}.${base64url(JSON.stringify(payload))}`;

  const key = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64url(signature)}`;
}

export async function fetchCoinbaseAccount(
  keyName: string,
  secret: string
): Promise<BinanceBalance[]> {
  // The private key may arrive as a real PEM (with newlines) or JSON-escaped.
  const privateKeyPem = secret.includes("\\n")
    ? secret.replace(/\\n/g, "\n")
    : secret;

  const jwt = buildJwt(keyName.trim(), privateKeyPem);

  const response = await fetch(`https://${HOST}${PATH}?limit=250`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Coinbase error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    accounts?: Array<{
      currency: string;
      available_balance?: { value: string };
      hold?: { value: string };
    }>;
  };

  return (data.accounts ?? [])
    .map((account) => ({
      asset: account.currency,
      free: Number(account.available_balance?.value ?? 0),
      locked: Number(account.hold?.value ?? 0),
    }))
    .filter((entry) => entry.free + entry.locked > 0);
}

export async function verifyCoinbaseKey(
  keyName: string,
  secret: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await fetchCoinbaseAccount(keyName, secret);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
