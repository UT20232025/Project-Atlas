import {
  backfillTrackRecordOutcomes,
  getTrackRecord,
  type TrackRecordSummary,
} from "@/lib/atlas/trackRecord";

// The public landing page recomputes this on every anonymous visit;
// closed-trade outcomes only change on an hourly-ish cadence (signals
// cross their 24h evaluation horizon), so a short cache avoids
// rescanning the full signal-snapshot history on every page load.
const CACHE_TTL_MS = 5 * 60 * 1000;

// How often (per running instance) to kick off a background price
// back-fill. Kept well above the cache TTL so a burst of visits only
// triggers one background job.
const BACKFILL_INTERVAL_MS = 15 * 60 * 1000;

let cachedEntry: {
  expiresAt: number;
  promise: Promise<TrackRecordSummary>;
} | null = null;

let lastBackfillAt = 0;
let backfillInFlight = false;

// Fire-and-forget: fill any missing entry/exit prices in the DB so the
// fetch-free render stays complete over time. Never awaited, so it can
// never slow a page render; on a long-running instance it self-heals,
// and the /api/cron/resolve-outcomes route covers everything else.
function kickBackgroundBackfill(): void {
  const now = Date.now();

  if (backfillInFlight || now - lastBackfillAt < BACKFILL_INTERVAL_MS) {
    return;
  }

  lastBackfillAt = now;
  backfillInFlight = true;

  backfillTrackRecordOutcomes()
    .catch((error) => {
      console.error("Background track-record backfill failed:", error);
    })
    .finally(() => {
      backfillInFlight = false;
    });
}

export function getCachedTrackRecord(): Promise<TrackRecordSummary> {
  kickBackgroundBackfill();

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.promise;
  }

  // Fetch-free by default — the slow Binance history fetches happen in
  // the background job above, never on this render path.
  const promise = getTrackRecord();

  cachedEntry = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    promise,
  };

  promise.catch(() => {
    if (cachedEntry?.promise === promise) {
      cachedEntry = null;
    }
  });

  return promise;
}
