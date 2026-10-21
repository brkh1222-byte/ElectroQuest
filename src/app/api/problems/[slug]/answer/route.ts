import { recordAnswerReveal } from "@/db/answers";
import { jsonError, requireUserAndProblem } from "@/lib/api";
import { formatDuration } from "@/lib/contest-time";
import { findAnswerLock } from "@/lib/contests";
import { getAnswer } from "@/lib/problems/loader";

// "Show answer": records the reveal (it takes the learner off this problem's leaderboard),
// then returns the reference solution and editorial.
export async function POST(_req: Request, ctx: RouteContext<"/api/problems/[slug]/answer">) {
  const { slug } = await ctx.params;
  const loaded = await requireUserAndProblem(slug, ["prompt", "pipeline", "scratch"], "Sign in to see the answer.");
  if ("error" in loaded) return loaded.error;

  // Contest participants can't see answers to that contest's problems until it ends.
  const contest = await findAnswerLock(loaded.user.id, slug);
  if (contest) {
    const left = formatDuration(Date.parse(contest.endsAt) - Date.now());
    return jsonError(403, `Show answer is off during ${contest.title}. It comes back when the contest ends, in ${left}.`);
  }

  const answer = await getAnswer(slug);
  if (!answer?.reference) return jsonError(404, "This problem has no answer yet.");
  await recordAnswerReveal(loaded.user.id, slug);
  return Response.json(answer);
}
