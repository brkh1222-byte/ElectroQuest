import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from ".";
import { streakDays, submissions } from "./schema";

/** Slugs of problems the user has an Accepted submission on. */
export async function getSolvedSlugs(userId: string): Promise<Set<string>> {
  if (!db) return new Set();
  const rows = await db
    .selectDistinct({ slug: submissions.problemSlug })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.accepted, true)));
  return new Set(rows.map((r) => r.slug));
}

/**
 * Days with at least one Accepted submission, newest first, as UTC `YYYY-MM-DD` strings
 * (the same calendar `recordSubmission` writes to streak_days).
 */
export async function getStreakDays(userId: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db
    .select({ day: streakDays.day })
    .from(streakDays)
    .where(eq(streakDays.userId, userId))
    .orderBy(desc(streakDays.day));
  return rows.map((r) => r.day);
}

/** How many Runs and Submits the user made on each UTC day from `since` (`YYYY-MM-DD`) on. */
export async function getPracticeCounts(userId: string, since: string): Promise<Map<string, number>> {
  if (!db) return new Map();
  const day = sql<string>`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day, count: sql<number>`count(*)::int` })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), gte(submissions.createdAt, new Date(`${since}T00:00:00Z`))))
    .groupBy(day);
  return new Map(rows.map((r) => [r.day, Number(r.count)]));
}

export type Streak = {
  /** Consecutive days with a solve, ending today, or yesterday when today has none yet. */
  current: number;
  longest: number;
  solvedToday: boolean;
};

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);

/** Streak lengths from the days with a solve (any order) and today's UTC date. */
export function computeStreak(days: string[], today: string): Streak {
  const sorted = [...new Set(days.map(dayNumber))].sort((a, b) => b - a);
  const todayN = dayNumber(today);
  let longest = 0;
  let run = 0;
  for (const [i, d] of sorted.entries()) {
    run = i > 0 && sorted[i - 1] - d === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  let current = 0;
  const start = sorted[0] === todayN || sorted[0] === todayN - 1 ? sorted[0] : null;
  if (start !== null) {
    for (const d of sorted) {
      if (d !== start - current) break;
      current++;
    }
  }
  return { current, longest, solvedToday: sorted[0] === todayN };
}
