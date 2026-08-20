import { NextResponse } from "next/server";

import { backfillTrackRecordOutcomes } from "@/lib/atlas/trackRecord";
import { resolveBreakoutOutcomes } from "@/lib/atlas/breakoutTrackRecord";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // No secret configured → endpoint stays closed rather than open.
  if (!secret) {
    return false;
  }

  const url = new URL(request.url);

  const provided =
    url.searchParams.get("key") ??
    request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "") ??
    "";

  return provided === secret;
}

// This does the slow Binance history fetches the landing page used to
// do on every render. Keep it off the render path and on a schedule.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await backfillTrackRecordOutcomes();
    const breakout = await resolveBreakoutOutcomes();

    return NextResponse.json({
      ok: true,
      ...result,
      ...breakout,
      resolvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Resolve-outcomes cron failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Resolve-outcomes failed.",
      },
      { status: 500 }
    );
  }
}

// Allow schedulers that only issue POST.
export async function POST(request: Request) {
  return GET(request);
}
