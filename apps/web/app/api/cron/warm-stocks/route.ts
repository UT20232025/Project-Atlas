import { NextResponse } from "next/server";

import {
  warmNextStaleStock,
  warmStockSnapshot,
  STOCK_SCANNER_SYMBOLS,
} from "@/lib/stocks/stockScanner";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const url = new URL(request.url);
  const provided =
    url.searchParams.get("key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  return provided === secret;
}

// Warm the curated stock cards into StockSnapshot, one ticker per request so the
// Twelve Data credits stay paced by the cron loop (which sleeps between calls).
// With no ?ticker, warms the stalest ticker and returns { done: true } once
// every ticker is fresh, so the loop can stop early.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker")?.toUpperCase();

  try {
    if (ticker) {
      if (!STOCK_SCANNER_SYMBOLS.includes(ticker)) {
        return NextResponse.json(
          { error: `Unknown ticker: ${ticker}` },
          { status: 400 }
        );
      }
      const item = await warmStockSnapshot(ticker);
      return NextResponse.json({ warmed: item.ticker, signal: item.signal });
    }

    const item = await warmNextStaleStock();
    if (!item) {
      return NextResponse.json({ done: true });
    }
    return NextResponse.json({ warmed: item.ticker, signal: item.signal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "warm failed" },
      { status: 500 }
    );
  }
}
