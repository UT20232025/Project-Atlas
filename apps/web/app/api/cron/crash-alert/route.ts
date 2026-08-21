import { NextResponse } from "next/server";

import { checkAndAlertCrashRisk } from "@/lib/atlas/crashAlert";

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

// Checks the crash Risk Radar and broadcasts a HIGH alert (push + Telegram) when
// it crosses into the danger zone. Debounced inside checkAndAlertCrashRisk.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkAndAlertCrashRisk();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "crash-alert failed" },
      { status: 500 }
    );
  }
}
