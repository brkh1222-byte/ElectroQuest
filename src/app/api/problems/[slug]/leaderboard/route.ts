import { getLeaderboard, type LeaderboardRow } from "@/db/leaderboard";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getProblem } from "@/lib/problems/loader";

// Both leaderboards for a prompt or pipeline problem (spec §4). Public; the viewer's row is marked.
export async function GET(_req: Request, ctx: RouteContext<"/api/problems/[slug]/leaderboard">) {
  const { slug } = await ctx.params;
  const problem = await getProblem(slug);
  if (!problem || problem.config.type === "scratch") return jsonError(404, "No leaderboard for this problem.");

  const viewerId = (await getCurrentUser())?.id ?? null;
  const [accuracy, efficiency] = await Promise.all([
    getLeaderboard(slug, "accuracy", viewerId),
    getLeaderboard(slug, "efficiency", viewerId),
  ]);

  // Don't expose Clerk user ids; the client only needs to know which row is the viewer's.
  const view = (r: LeaderboardRow) => ({
    rank: r.rank,
    name: r.name,
    imageUrl: r.imageUrl,
    score: r.score,
    tokens: r.tokens,
    achievedAt: r.achievedAt,
    isMe: r.userId === viewerId,
  });
  const board = (b: Awaited<ReturnType<typeof getLeaderboard>>) => ({ top: b.top.map(view), me: b.me && view(b.me) });
  return Response.json({ accuracy: board(accuracy), efficiency: board(efficiency) });
}
