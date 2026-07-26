import { NextResponse } from "next/server";

import { getAtlasAnalysis } from "@/lib/atlas/getAtlasAnalysis";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import {
  MARKET_SYMBOLS,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";

const ALLOWED_INTERVALS: BinanceInterval[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
];

function isMarketSymbol(value: string): value is MarketSymbol {
  return MARKET_SYMBOLS.includes(value as MarketSymbol);
}

function isBinanceInterval(
  value: string
): value is BinanceInterval {
  return ALLOWED_INTERVALS.includes(
    value as BinanceInterval
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const symbol = (
    searchParams.get("symbol") ?? "BTCUSDT"
  ).toUpperCase();

  const interval =
    searchParams.get("interval") ?? "1h";

  if (!isMarketSymbol(symbol)) {
    return NextResponse.json(
      {
        error: `Unsupported market symbol: ${symbol}`,
      },
      {
        status: 400,
      }
    );
  }

  if (!isBinanceInterval(interval)) {
    return NextResponse.json(
      {
        error: `Unsupported interval: ${interval}`,
      },
      {
        status: 400,
      }
    );
  }

  try {
    const result = await getAtlasAnalysis(
      symbol,
      interval
    );

    return NextResponse.json({
      symbol,
      interval,
      analysis: result.analysis,
      tradeSetup: result.tradeSetup,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Atlas analysis failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Atlas analysis failed.",
      },
      {
        status: 500,
      }
    );
  }
}