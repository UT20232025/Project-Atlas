// A lightweight in-memory daily quota per user for the Ask Atlas chat — the
// cost guard that keeps a single heavy user (or abuse) from running up the
// Anthropic bill. Not durable across redeploys/instances by design; it's a
// cheap backstop on top of Anthropic's own spend limits, not accounting.

const DEFAULT_DAILY_LIMIT = 40;

function getDailyLimit(): number {
  const raw = Number(process.env.ATLAS_CHAT_DAILY_LIMIT);

  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_LIMIT;
}

type QuotaEntry = {
  day: string;
  count: number;
};

const usage = new Map<string, QuotaEntry>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export type QuotaResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
};

/**
 * Records one Ask Atlas message for the user and reports whether it's within
 * today's limit. Call this only when a paid model request is about to run.
 */
export function consumeChatQuota(userId: string): QuotaResult {
  const limit = getDailyLimit();
  const day = today();
  const entry = usage.get(userId);

  if (!entry || entry.day !== day) {
    usage.set(userId, { day, count: 1 });

    return { allowed: true, remaining: limit - 1, limit };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  entry.count += 1;

  return { allowed: true, remaining: limit - entry.count, limit };
}
