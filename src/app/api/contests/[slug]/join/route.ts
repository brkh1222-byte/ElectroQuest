import { joinContest } from "@/db/contests";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { contestPhase } from "@/lib/contest-time";
import { contestNow, getContest } from "@/lib/contests";

// Signs the learner up for a contest. Allowed before it starts and while it runs.
export async function POST(_req: Request, ctx: RouteContext<"/api/contests/[slug]/join">) {
  const { slug } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to join the contest.");
  const contest = await getContest(slug);
  if (!contest) return jsonError(404, "Contest not found.");
  if (contestPhase(contest, await contestNow()) === "ended") return jsonError(409, "This contest has ended.");

  if (!(await joinContest(slug, user.id))) return jsonError(503, "Contests aren't available right now.");
  return Response.json({ ok: true });
}
