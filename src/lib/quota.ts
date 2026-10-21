import "server-only";

import { redis } from "./redis";

// Daily submission-count quota for LLM problems (spec §7). Scratch problems are unlimited.
export const DAILY_LIMITS = { run: 50, submit: 15 } as const;
export type QuotaKind = keyof typeof DAILY_LIMITS;

const KEY_TTL_SECONDS = 2 * 24 * 60 * 60; // outlives the UTC day it counts

function key(userId: string, kind: QuotaKind) {
  const day = new Date().toISOString().slice(0, 10); // resets at 00:00 UTC
  return `quota:${day}:${userId}:${kind}`;
}

export async function getQuota(userId: string) {
  const [run, submit] = await redis().mget<(number | null)[]>(key(userId, "run"), key(userId, "submit"));
  return {
    run: { used: run ?? 0, limit: DAILY_LIMITS.run },
    submit: { used: submit ?? 0, limit: DAILY_LIMITS.submit },
  };
}

/** Consumes one unit; returns false if the user is over the limit. */
export async function consumeQuota(userId: string, kind: QuotaKind) {
  const k = key(userId, kind);
  const [used] = await redis().pipeline().incr(k).expire(k, KEY_TTL_SECONDS).exec<[number, number]>();
  if (used <= DAILY_LIMITS[kind]) return true;
  await redis().decr(k); // keep the shown count at the limit
  return false;
}
