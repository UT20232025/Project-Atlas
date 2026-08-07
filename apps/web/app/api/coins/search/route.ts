import { NextResponse } from "next/server";

import { searchCoins } from "@/lib/services/binanceUniverse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const results = await searchCoins(query, 8);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Coin search failed:", error);

    return NextResponse.json(
      { error: "Coin search failed." },
      { status: 500 }
    );
  }
}
