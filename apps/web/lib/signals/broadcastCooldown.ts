// Prevents signal spam. A curated signal can flap around its threshold
// (LONG -> WAIT -> LONG ...), and every re-entry is technically a "change",
// so without this the channel gets several near-identical signals for the
// same coin within minutes. We still RECORD every change (for the track
// record) — we just don't re-BROADCAST the same coin+direction too often.
//
// In-memory per server instance; resets on redeploy. That's fine — the goal
// is to debounce rapid flapping, not to persist state forever.

const DEFAULT_COOLDOWN_MINUTES = 120;

function cooldownMs(): number {
  const raw = process.env.SIGNAL_BROADCAST_COOLDOWN_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  const minutes = Number.isFinite(parsed)
    ? parsed
    : DEFAULT_COOLDOWN_MINUTES;

  return minutes * 60_000;
}

const lastBroadcast = new Map<string, number>();

/**
 * Returns true (and arms the cooldown) if this coin+direction hasn't been
 * broadcast within the cooldown window; false if it's still cooling down.
 */
export function shouldBroadcastSignal(
  symbol: string,
  direction: string
): boolean {
  const key = `${symbol}:${direction}`;
  const now = Date.now();
  const last = lastBroadcast.get(key);

  if (last != null && now - last < cooldownMs()) {
    return false;
  }

  lastBroadcast.set(key, now);
  return true;
}
