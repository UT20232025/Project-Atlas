import {
  getTrackRecord,
  type TrackRecordSummary,
} from "@/lib/atlas/trackRecord";

// The public landing page recomputes this on every anonymous visit;
// closed-trade outcomes only change on an hourly-ish cadence (signals
// cross their 24h evaluation horizon), so a short cache avoids
// rescanning the full signal-snapshot history on every page load.
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedEntry: {
  expiresAt: number;
  promise: Promise<TrackRecordSummary>;
} | null = null;

export function getCachedTrackRecord(): Promise<TrackRecordSummary> {
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.promise;
  }

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
