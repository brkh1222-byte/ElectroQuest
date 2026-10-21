import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from ".";
import { leaderboardEntries, streakDays, submissions } from "./schema";
import { ensureUser } from "./users";

export async function recordSubmission(s: {
  userId: string;
  slug: string;
  kind: "run" | "submit";
  content: string;
  settings?: { temperature?: number; maxOutputTokens?: number; model?: string };
  score: number;
  tokens: number;
  accepted: boolean;
  /** False for from-scratch problems: tests are public, so they get no leaderboard (spec §3.3). */
  ranked?: boolean;
}) {
  if (!db) return; // no database configured yet

  await ensureUser(s.userId);
  await db.insert(submissions).values({
    userId: s.userId,
    problemSlug: s.slug,
    kind: s.kind,
    content: s.content,
    settings: s.settings,
    score: s.score,
    tokens: s.tokens,
    accepted: s.accepted,
  });

  if (s.kind !== "submit") return;

  if (s.ranked !== false) {
    const lb = leaderboardEntries;
    // SET expressions see the old row, so each "improved?" check compares against the previous best.
    const scoreImproved = sql`excluded.best_score > ${lb.bestScore}`;
    const tokensImproved = sql`excluded.best_tokens is not null and (${lb.bestTokens} is null or excluded.best_tokens < ${lb.bestTokens})`;
    await db
      .insert(lb)
      .values({
        problemSlug: s.slug,
        userId: s.userId,
        bestScore: s.score,
        bestTokens: s.accepted ? s.tokens : null,
        bestTokensAt: s.accepted ? sql`now()` : null,
      })
      .onConflictDoUpdate({
        target: [lb.problemSlug, lb.userId],
        set: {
          bestScore: sql`case when ${scoreImproved} then excluded.best_score else ${lb.bestScore} end`,
          bestScoreAt: sql`case when ${scoreImproved} then now() else ${lb.bestScoreAt} end`,
          bestTokens: sql`case when ${tokensImproved} then excluded.best_tokens else ${lb.bestTokens} end`,
          bestTokensAt: sql`case when ${tokensImproved} then now() else ${lb.bestTokensAt} end`,
          updatedAt: sql`now()`,
        },
      });
  }

  if (s.accepted) {
    await db
      .insert(streakDays)
      .values({ userId: s.userId, day: new Date().toISOString().slice(0, 10) })
      .onConflictDoNothing();
  }
}

/** The user's recent Submits on one problem, newest first (Runs aren't shown). */
export async function listSubmissions(userId: string, slug: string, limit = 20) {
  if (!db) return [];
  return db
    .select({
      id: submissions.id,
      content: submissions.content,
      settings: submissions.settings,
      score: submissions.score,
      tokens: submissions.tokens,
      accepted: submissions.accepted,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.problemSlug, slug), eq(submissions.kind, "submit")))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);
}
