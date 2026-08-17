import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";

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

const MIN_COUNT = 8;

// Confidence-calibration analysis: rank each reason/warning code by its win-rate
// edge vs the baseline, over resolved LONG/SHORT signals that carry a factor
// snapshot. The high-edge factors are the ones to up-weight in the confidence
// formula; near-zero-edge factors are noise. Read-only.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.signalSnapshot.findMany({
      where: {
        signal: { in: ["LONG", "SHORT"] },
        price: { not: null },
        outcomePrice: { not: null },
        factors: { not: null },
      },
      select: {
        signal: true,
        price: true,
        outcomePrice: true,
        factors: true,
      },
    });

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        resolvedFactoredSignals: 0,
        note: "No resolved signals with factors yet — let the instrumentation collect for a few more days.",
      });
    }

    const pnl = (r: (typeof rows)[number]) => {
      const raw =
        (((r.outcomePrice as number) - (r.price as number)) /
          (r.price as number)) *
        100;
      return r.signal === "SHORT" ? -raw : raw;
    };
    const isWin = (r: (typeof rows)[number]) => pnl(r) > 0;

    const baseWins = rows.filter(isWin).length;
    const baseRate = (100 * baseWins) / rows.length;

    const tally = new Map<string, { n: number; wins: number }>();
    for (const r of rows) {
      let parsed: { reasons?: string[]; warnings?: string[] };
      try {
        parsed = JSON.parse(r.factors as string);
      } catch {
        continue;
      }
      const codes = [
        ...(parsed.reasons ?? []).map((x) => "R:" + x),
        ...(parsed.warnings ?? []).map((x) => "W:" + x),
      ];
      const win = isWin(r);
      for (const code of new Set(codes)) {
        const e = tally.get(code) ?? { n: 0, wins: 0 };
        e.n += 1;
        e.wins += win ? 1 : 0;
        tally.set(code, e);
      }
    }

    const factors = [...tally.entries()]
      .filter(([, e]) => e.n >= MIN_COUNT)
      .map(([code, e]) => ({
        code,
        n: e.n,
        winRate: Math.round((100 * e.wins) / e.n),
        edge: Math.round(((100 * e.wins) / e.n - baseRate) * 10) / 10,
      }))
      .sort((a, b) => b.edge - a.edge);

    return NextResponse.json({
      ok: true,
      resolvedFactoredSignals: rows.length,
      baselineWinRate: Math.round(baseRate * 10) / 10,
      minSamples: MIN_COUNT,
      factors,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Factor-analysis cron failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Factor analysis failed.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
