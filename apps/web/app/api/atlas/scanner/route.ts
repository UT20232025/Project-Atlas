import { NextResponse } from "next/server";

import { getAtlasScanner } from "@/lib/analysis/scanner";

export async function GET() {
  try {
    const items = await getAtlasScanner();

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
