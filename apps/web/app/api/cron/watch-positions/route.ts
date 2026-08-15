import { NextResponse } from "next/server";

import { watchOpenPositions } from "@/lib/trading/watchPositions";

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

// Pushes an EXIT alert to a position's owner when Atlas flips against it.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await watchOpenPositions();

    return NextResponse.json({
      ok: true,
      ...result,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Watch-positions cron failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Watch-positions failed.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
