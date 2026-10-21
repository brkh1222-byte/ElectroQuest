import "server-only";

// Daily submission-count quota for LLM problems (spec §7). Scratch problems are unlimited.
export const DAILY_LIMITS = { run: 50, submit: 15 } as const;
export type QuotaKind = keyof typeof DAILY_LIMITS;

// TODO: move to Upstash Redis (INCR + EXPIREAT) — this in-memory map is per-instance only.
const usage = new Map<string, number>();

function key(userId: string, kind: QuotaKind) {
  const day = new Date().toISOString().slice(0, 10); // resets at 00:00 UTC
  return `${day}:${userId}:${kind}`;
}

export function getQuota(userId: string) {
  return {
    run: { used: usage.get(key(userId, "run")) ?? 0, limit: DAILY_LIMITS.run },
    submit: { used: usage.get(key(userId, "submit")) ?? 0, limit: DAILY_LIMITS.submit },
  };
}

/** Consumes one unit; returns false if the user is over the limit. */
export function consumeQuota(userId: string, kind: QuotaKind) {
  const k = key(userId, kind);
  const used = usage.get(k) ?? 0;
  if (used >= DAILY_LIMITS[kind]) return false;
  usage.set(k, used + 1);
  return true;
}
