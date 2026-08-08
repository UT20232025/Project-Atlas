import { NextResponse } from "next/server";

import { searchCoins } from "@/lib/services/binanceUniverse";
import { searchStocks } from "@/lib/services/twelveDataService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const [coins, stocks] = await Promise.all([
      searchCoins(query, 8),
      Promise.resolve(searchStocks(query, 4)),
    ]);

    // Crypto first (crypto-first product), then matching stocks; cap at 8.
    const results = [...coins, ...stocks].slice(0, 8);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Coin search failed:", error);

    return NextResponse.json(
      { error: "Coin search failed." },
      { status: 500 }
    );
  }
}
