import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from ".";
import { answerReveals } from "./schema";
import { ensureUser } from "./users";

export async function recordAnswerReveal(userId: string, slug: string) {
  if (!db) return;
  await ensureUser(userId);
  await db.insert(answerReveals).values({ userId, problemSlug: slug }).onConflictDoNothing();
}

export async function hasRevealedAnswer(userId: string, slug: string) {
  if (!db) return false;
  const rows = await db
    .select({ slug: answerReveals.problemSlug })
    .from(answerReveals)
    .where(and(eq(answerReveals.userId, userId), eq(answerReveals.problemSlug, slug)))
    .limit(1);
  return rows.length > 0;
}

/** Slugs of problems where the user looked at the answer. */
export async function getRevealedSlugs(userId: string): Promise<Set<string>> {
  if (!db) return new Set();
  const rows = await db
    .select({ slug: answerReveals.problemSlug })
    .from(answerReveals)
    .where(eq(answerReveals.userId, userId));
  return new Set(rows.map((r) => r.slug));
}
