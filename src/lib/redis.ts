import "server-only";

import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** Upstash Redis (Vercel Marketplace). Lazy so `next build` works before env vars exist. */
export function redis() {
  if (!client) {
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error("Upstash Redis is not configured. Run `vercel env pull` to get KV_REST_API_URL.");
    }
    client = Redis.fromEnv();
  }
  return client;
}
