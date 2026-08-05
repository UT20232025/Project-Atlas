import { NextResponse } from "next/server";

import { runDailyBrief } from "@/lib/telegram/dailyBrief";

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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const dryRun =
    new URL(request.url).searchParams.get("dry") === "1";

  try {
    const result = await runDailyBrief(dryRun);

    return NextResponse.json({
      ok: true,
      dryRun,
      ...result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Daily brief failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Daily brief failed.",
      },
      { status: 500 }
    );
  }
}

// Allow schedulers that only issue POST.
export async function POST(request: Request) {
  return GET(request);
}
