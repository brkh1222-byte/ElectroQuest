import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { redis } from "./redis";

/**
 * A run/submit session for a pipeline problem (spec §6).
 * The token authorizes LLM proxy calls from the learner's Pyodide worker
 * and ties token usage to one attempt. It is HMAC-signed, so it can't be forged.
 * Claims live in the token; counters live in Redis so every server instance sees them.
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
  inputTokens: number;
  outputTokens: number;
  scored: boolean;
};

type StoredSession = { inputTokens?: number; outputTokens?: number; scored?: number };

const SESSION_TTL_MS = 15 * 60 * 1000;
const TTL_SECONDS = SESSION_TTL_MS / 1000;

const stateKey = (sid: string) => `session:${sid}`;
const callsKey = (sid: string) => `session:${sid}:calls`; // per-case LLM call counts

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return "dev-only-insecure-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(userId: string, slug: string, mode: SessionClaims["mode"]) {
  const claims: SessionClaims = { sid: randomUUID(), userId, slug, mode, exp: Date.now() + SESSION_TTL_MS };
  await redis()
    .pipeline()
    .hset(stateKey(claims.sid), { inputTokens: 0, outputTokens: 0 })
    .expire(stateKey(claims.sid), TTL_SECONDS)
    .exec();
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { claims, token: `${payload}.${sign(payload)}` };
}

export async function verifySession(token: string | null | undefined): Promise<SessionState | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionClaims;
  if (claims.exp < Date.now()) return null;
  const stored = await redis().hgetall<StoredSession>(stateKey(claims.sid));
  if (!stored) return null;
  return {
    claims,
    inputTokens: Number(stored.inputTokens ?? 0),
    outputTokens: Number(stored.outputTokens ?? 0),
    scored: Boolean(Number(stored.scored ?? 0)),
  };
}

/** Counts one LLM call for a test case; returns false once the case is over its cap. */
export async function claimCall(sid: string, caseId: string, maxCalls: number) {
  const [calls] = await redis()
    .pipeline()
    .hincrby(callsKey(sid), caseId, 1)
    .expire(callsKey(sid), TTL_SECONDS)
    .exec<[number, number]>();
  return calls <= maxCalls;
}

export async function addUsage(sid: string, inputTokens: number, outputTokens: number) {
  await redis()
    .pipeline()
    .hincrby(stateKey(sid), "inputTokens", inputTokens)
    .hincrby(stateKey(sid), "outputTokens", outputTokens)
    .exec();
}

/** Atomically marks the attempt scored; false if it already was (blocks double-scoring). */
export async function markScored(sid: string) {
  return (await redis().hsetnx(stateKey(sid), "scored", 1)) === 1;
}

export function bearerToken(req: Request) {
  return req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
}
