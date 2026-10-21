import "server-only";

import { sql } from "drizzle-orm";
import { db } from ".";
import { leaderboardEntries, streakDays, submissions } from "./schema";

export async function recordSubmission(s: {
  userId: string;
  slug: string;
  kind: "run" | "submit";
  content: string;
  score: number;
  tokens: number;
  accepted: boolean;
}) {
  if (!db) return; // no database configured yet

  await db.insert(submissions).values({
    userId: s.userId,
    problemSlug: s.slug,
    kind: s.kind,
    content: s.content,
    score: s.score,
    tokens: s.tokens,
    accepted: s.accepted,
  });

  if (s.kind !== "submit") return;

  await db
    .insert(leaderboardEntries)
    .values({
      problemSlug: s.slug,
      userId: s.userId,
      bestScore: s.score,
      bestTokens: s.accepted ? s.tokens : null,
    })
    .onConflictDoUpdate({
      target: [leaderboardEntries.problemSlug, leaderboardEntries.userId],
      set: {
        bestScore: sql`greatest(${leaderboardEntries.bestScore}, ${s.score})`,
        bestTokens: s.accepted
          ? sql`least(coalesce(${leaderboardEntries.bestTokens}, ${s.tokens}), ${s.tokens})`
          : sql`${leaderboardEntries.bestTokens}`,
        updatedAt: sql`now()`,
      },
    });

  if (s.accepted) {
    await db
      .insert(streakDays)
      .values({ userId: s.userId, day: new Date().toISOString().slice(0, 10) })
      .onConflictDoNothing();
  }
}
