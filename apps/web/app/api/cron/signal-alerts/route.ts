import { NextResponse } from "next/server";

import { runSignalAlerts } from "@/lib/alerts/signalAlerts";

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

// Pushes "your asset just became a trade" alerts to users who asked to be
// notified. Reads current signals from the DB (no market API calls), so it's
// cheap to run often.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sent } = await runSignalAlerts();
    return NextResponse.json({ sent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "alerts failed" },
      { status: 500 }
    );
  }
}
