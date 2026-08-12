import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAtlasScanner } from "@/lib/analysis/scanner";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";

const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("interval");
    const interval: BinanceInterval =
      raw && INTERVALS.includes(raw) ? (raw as BinanceInterval) : "1h";

    const items = await getAtlasScanner(interval);

    return NextResponse.json({
      items: items.map((item) => ({
        coin: item.coin,
        signal: item.signal,
        confidence: item.confidence,
      })),

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Atlas scanner failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Atlas scanner failed.",
      },
      {
        status: 500,
      }
    );
  }
}
