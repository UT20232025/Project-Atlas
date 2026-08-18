import { NextResponse } from "next/server";

import { getAtlasScanner } from "@/lib/analysis/scanner";

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

// Runs the crypto scanner so signal history keeps accumulating regardless of
// site traffic. recordSignalIfChanged fires inside getCachedAtlasAnalysis for
// every symbol, so each run persists any 1h signal *changes* (with their
// reason/warning factors) to SignalSnapshot — the raw material the confidence
// calibration needs. Without this, signals were only recorded when a human
// happened to load the dashboard, and the data dried up.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getAtlasScanner("1h");
    return NextResponse.json({ scanned: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "scan failed" },
      { status: 500 }
    );
  }
}
