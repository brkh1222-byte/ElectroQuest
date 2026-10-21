import { z } from "zod";
import { listSubmissions, recordSubmission } from "@/db/submissions";
import { jsonError, parseBody, requireUserAndProblem } from "@/lib/api";

// The signed-in user's Submits on this problem (Submissions tab).
export async function GET(_req: Request, ctx: RouteContext<"/api/problems/[slug]/submissions">) {
  const { slug } = await ctx.params;
  const loaded = await requireUserAndProblem(slug, ["prompt", "pipeline", "scratch"], "Sign in to see your submissions.");
  if ("error" in loaded) return loaded.error;
  const rows = await listSubmissions(loaded.user.id, slug);
  return Response.json({ submissions: rows });
}

const bodySchema = z.object({
  code: z.string().max(50_000),
  passed: z.number().int().min(0),
  total: z.number().int().min(1),
});

/**
 * Records a from-scratch Submit. Those are graded in the browser (spec §3.3), so the result is
 * self-reported: it counts toward history and streaks but never a leaderboard.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/problems/[slug]/submissions">) {
  const { slug } = await ctx.params;
  const loaded = await requireUserAndProblem(slug, ["scratch"], "Sign in to save your submissions.");
  if ("error" in loaded) return loaded.error;
  const { user, problem } = loaded;

  const body = await parseBody(req, bodySchema);
  const total = problem.visibleTests.length + problem.hiddenTests.length;
  if (!body || body.total !== total || body.passed > total) return jsonError(400, "Invalid request.");

  await recordSubmission({
    userId: user.id,
    slug,
    kind: "submit",
    content: body.code,
    score: body.passed / total,
    tokens: 0,
    accepted: body.passed === total,
    ranked: false,
  });
  return Response.json({ ok: true });
}
