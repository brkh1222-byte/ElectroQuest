import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * A run/submit session for a pipeline problem (spec §6).
 * The token authorizes LLM proxy calls from the learner's Pyodide worker
 * and ties token usage to one attempt. It is HMAC-signed, so it can't be forged.
 */
export type SessionClaims = {
  sid: string;
  userId: string;
  slug: string;
  mode: "run" | "submit";
  exp: number; // unix ms
};

export type SessionState = {
  claims: SessionClaims;
  calls: Map<string, number>; // per-case LLM call counts
  inputTokens: number;
  outputTokens: number;
  scored: boolean;
};

const SESSION_TTL_MS = 15 * 60 * 1000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return "dev-only-insecure-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

// TODO: move to Redis/Postgres (`submit_sessions` table) — in-memory state is per-instance only.
const sessions = new Map<string, SessionState>();

export function createSession(userId: string, slug: string, mode: SessionClaims["mode"]) {
  const claims: SessionClaims = { sid: randomUUID(), userId, slug, mode, exp: Date.now() + SESSION_TTL_MS };
  sessions.set(claims.sid, { claims, calls: new Map(), inputTokens: 0, outputTokens: 0, scored: false });
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { claims, token: `${payload}.${sign(payload)}` };
}

export function verifySession(token: string | null | undefined): SessionState | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionClaims;
  if (claims.exp < Date.now()) return null;
  return sessions.get(claims.sid) ?? null;
}

export function bearerToken(req: Request) {
  return req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
}
