import "server-only";

import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from ".";
import { leaderboardEntries as lb, users } from "./schema";

export type BoardKind = "accuracy" | "efficiency";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  imageUrl: string | null;
  score: number;
  tokens: number | null;
  achievedAt: Date;
};

const boards = {
  // Most accurate: best hidden-set score.
  accuracy: { rank: sql`rank() over (order by ${lb.bestScore} desc)`, achievedAt: lb.bestScoreAt, filter: undefined },
  // Most efficient: fewest tokens among Accepted submissions (spec §4).
  efficiency: { rank: sql`rank() over (order by ${lb.bestTokens} asc)`, achievedAt: lb.bestTokensAt, filter: isNotNull(lb.bestTokens) },
} as const;

async function queryBoard(slug: string, kind: BoardKind, opts: { limit: number; userId?: string }) {
  if (!db) return [];
  const board = boards[kind];
  const ranked = db.$with("ranked").as(
    db
      .select({
        userId: lb.userId,
        score: lb.bestScore,
        tokens: lb.bestTokens,
        // mapWith(column) parses the timestamp as UTC, like the column itself does.
        achievedAt: sql<Date>`${board.achievedAt}`.mapWith(board.achievedAt).as("achieved_at"),
        rank: board.rank.mapWith(Number).as("rank"),
      })
      .from(lb)
      .where(and(eq(lb.problemSlug, slug), board.filter)),
  );
  const rows = await db
    .with(ranked)
    .select({
      rank: ranked.rank,
      userId: ranked.userId,
      score: ranked.score,
      tokens: ranked.tokens,
      achievedAt: ranked.achievedAt,
      username: users.username,
      displayName: users.displayName,
      imageUrl: users.imageUrl,
    })
    .from(ranked)
    .leftJoin(users, eq(users.id, ranked.userId))
    .where(opts.userId ? eq(ranked.userId, opts.userId) : undefined)
    .orderBy(asc(ranked.rank), asc(ranked.achievedAt))
    .limit(opts.limit);

  return rows.map(
    (r): LeaderboardRow => ({
      rank: r.rank,
      userId: r.userId,
      name: r.displayName ?? r.username ?? "Anonymous",
      imageUrl: r.imageUrl,
      score: r.score,
      tokens: r.tokens,
      achievedAt: new Date(r.achievedAt),
    }),
  );
}

/** Top entries for one board, plus the viewer's own entry when they're outside the top. */
export async function getLeaderboard(slug: string, kind: BoardKind, viewerId: string | null, limit = 50) {
  const [top, mine] = await Promise.all([
    queryBoard(slug, kind, { limit }),
    viewerId ? queryBoard(slug, kind, { limit: 1, userId: viewerId }) : Promise.resolve([]),
  ]);
  const me = mine[0] ?? null;
  return { top, me: me && !top.some((r) => r.userId === me.userId) ? me : null };
}
