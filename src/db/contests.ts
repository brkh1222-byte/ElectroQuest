import "server-only";

import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from ".";
import { answerReveals, contestEntries, submissions, users } from "./schema";
import { ensureUser } from "./users";

/** Signs the user up. Returns false when there is no database to store the entry. */
export async function joinContest(contestSlug: string, userId: string) {
  if (!db) return false;
  await ensureUser(userId);
  await db.insert(contestEntries).values({ contestSlug, userId }).onConflictDoNothing();
  return true;
}

export async function hasJoined(contestSlug: string, userId: string) {
  if (!db) return false;
  const rows = await db
    .select({ userId: contestEntries.userId })
    .from(contestEntries)
    .where(and(eq(contestEntries.contestSlug, contestSlug), eq(contestEntries.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/** Number of learners who joined each contest. */
export async function countEntries(): Promise<Map<string, number>> {
  if (!db) return new Map();
  const rows = await db
    .select({ slug: contestEntries.contestSlug, n: count() })
    .from(contestEntries)
    .groupBy(contestEntries.contestSlug);
  return new Map(rows.map((r) => [r.slug, r.n]));
}

/** What scoring needs to know about a contest. */
export type ContestWindow = {
  slug: string;
  startsAt: string;
  endsAt: string;
  problems: { slug: string; points: number }[];
};

export type StandingRow = {
  /** Shared by learners with the same points, tokens and finish time. */
  rank: number;
  userId: string;
  name: string;
  imageUrl: string | null;
  points: number;
  /** Problems that earned points. */
  solved: string[];
  /** Problems whose answer the learner saw before the end; they earn no points. */
  helped: string[];
  /** Sum of the lowest-token Accepted Submit on each solved problem. */
  tokens: number;
  /** When the learner reached their current points; null with no solves. */
  finishedAt: Date | null;
};

/**
 * Contest standings, computed from the submissions table (nothing is copied):
 * - a problem is solved by an Accepted Submit made after joining and inside [startsAt, endsAt);
 * - each solved problem gives its points, unless the learner saw its answer before the end;
 * - ranking: most points, then fewest tokens, then earliest finish.
 */
export async function getStandings(contest: ContestWindow): Promise<StandingRow[]> {
  if (!db) return [];
  const slugs = contest.problems.map((p) => p.slug);
  const startsAt = new Date(contest.startsAt);
  const endsAt = new Date(contest.endsAt);
  const isEntrant = (userId: typeof submissions.userId | typeof answerReveals.userId) =>
    and(eq(contestEntries.contestSlug, contest.slug), eq(contestEntries.userId, userId));

  const [entries, solves, reveals] = await Promise.all([
    db
      .select({
        userId: contestEntries.userId,
        joinedAt: contestEntries.joinedAt,
        username: users.username,
        displayName: users.displayName,
        imageUrl: users.imageUrl,
      })
      .from(contestEntries)
      .leftJoin(users, eq(users.id, contestEntries.userId))
      .where(eq(contestEntries.contestSlug, contest.slug)),
    // Each participant's first Accepted Submit time and fewest tokens per contest problem.
    db
      .select({
        userId: submissions.userId,
        slug: submissions.problemSlug,
        solvedAt: sql<Date>`min(${submissions.createdAt})`.mapWith(submissions.createdAt),
        tokens: sql<number>`min(${submissions.tokens})`.mapWith(Number),
      })
      .from(submissions)
      .innerJoin(contestEntries, isEntrant(submissions.userId))
      .where(
        and(
          inArray(submissions.problemSlug, slugs),
          eq(submissions.kind, "submit"),
          eq(submissions.accepted, true),
          gte(submissions.createdAt, startsAt),
          gte(submissions.createdAt, contestEntries.joinedAt),
          lt(submissions.createdAt, endsAt),
        ),
      )
      .groupBy(submissions.userId, submissions.problemSlug),
    db
      .select({ userId: answerReveals.userId, slug: answerReveals.problemSlug })
      .from(answerReveals)
      .innerJoin(contestEntries, isEntrant(answerReveals.userId))
      .where(and(inArray(answerReveals.problemSlug, slugs), lt(answerReveals.revealedAt, endsAt))),
  ]);

  const points = new Map(contest.problems.map((p) => [p.slug, p.points]));
  const helpedBy = new Map<string, Set<string>>();
  for (const r of reveals) helpedBy.set(r.userId, (helpedBy.get(r.userId) ?? new Set()).add(r.slug));
  const solvesBy = new Map<string, typeof solves>();
  for (const s of solves) solvesBy.set(s.userId, [...(solvesBy.get(s.userId) ?? []), s]);

  const rows = entries.map((e) => {
    const helped = helpedBy.get(e.userId) ?? new Set<string>();
    const counted = (solvesBy.get(e.userId) ?? []).filter((s) => !helped.has(s.slug));
    const finishedAt = counted.reduce<Date | null>((a, s) => (a && a > s.solvedAt ? a : s.solvedAt), null);
    return {
      userId: e.userId,
      joinedAt: e.joinedAt,
      name: e.displayName ?? e.username ?? "Anonymous",
      imageUrl: e.imageUrl,
      points: counted.reduce((sum, s) => sum + (points.get(s.slug) ?? 0), 0),
      solved: counted.map((s) => s.slug),
      helped: [...helped],
      tokens: counted.reduce((sum, s) => sum + s.tokens, 0),
      finishedAt,
    };
  });

  const finish = (r: (typeof rows)[number]) => r.finishedAt?.getTime() ?? Infinity;
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      a.tokens - b.tokens ||
      finish(a) - finish(b) ||
      a.joinedAt.getTime() - b.joinedAt.getTime(),
  );

  // Standard competition ranking ("1, 2, 2, 4"): rows that tie on every rule share a rank.
  let rank = 0;
  return rows.map((r, i): StandingRow => {
    const prev = rows[i - 1];
    if (!prev || prev.points !== r.points || prev.tokens !== r.tokens || finish(prev) !== finish(r)) rank = i + 1;
    const { userId, name, imageUrl, points, solved, helped, tokens, finishedAt } = r;
    return { rank, userId, name, imageUrl, points, solved, helped, tokens, finishedAt };
  });
}
