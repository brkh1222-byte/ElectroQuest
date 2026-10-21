import { z } from "zod";
import { recordSubmission } from "@/db/submissions";
import { jsonError, parseBody } from "@/lib/api";
import { getProblem } from "@/lib/problems/loader";
import { aggregate, scoreCase, type CaseResult } from "@/lib/scoring";
import { bearerToken, verifySession } from "@/lib/sessions";

const bodySchema = z.object({
  code: z.string().max(50_000),
  outputs: z.record(z.string(), z.object({ value: z.unknown().optional(), error: z.string().optional() })),
});

// Scores outputs produced in the learner's browser against server-held expected outputs.
export async function POST(req: Request, ctx: RouteContext<"/api/problems/[slug]/score">) {
  const { slug } = await ctx.params;
  const session = verifySession(bearerToken(req));
  if (!session || session.claims.slug !== slug) return jsonError(401, "Session expired. Run again.");
  if (session.scored) return jsonError(409, "This attempt was already scored.");

  const problem = await getProblem(slug);
  if (!problem) return jsonError(404, "Problem not found.");
  const body = await parseBody(req, bodySchema);
  if (!body) return jsonError(400, "Invalid request.");
  session.scored = true;

  const { mode } = session.claims;
  const tests = mode === "run" ? problem.visibleTests : problem.hiddenTests;
  const metric = problem.config.metric ?? "contains_any";
  const results: CaseResult[] = tests.map((test) => {
    const out = body.outputs[test.id];
    if (!out || out.error) return { id: test.id, passed: false, actual: null, error: out?.error ?? "No output" };
    return { id: test.id, passed: scoreCase(metric, test, out.value), actual: out.value };
  });

  const summary = aggregate(results);
  // Token counts come from the proxy, not the client, so the efficiency leaderboard can't be faked.
  const tokens = session.inputTokens + session.outputTokens;

  if (mode === "run") {
    const cases = results.map((r, i) => ({ ...r, input: tests[i].args, expected: tests[i].expected }));
    return Response.json({ mode, ...summary, tokens, cases });
  }

  const accepted = summary.score >= (problem.config.threshold ?? 1);
  await recordSubmission({
    userId: session.claims.userId,
    slug,
    kind: "submit",
    content: body.code,
    score: summary.score,
    tokens,
    accepted,
  });
  const cases = results.map((r) => ({ id: r.id, passed: r.passed, error: r.error }));
  return Response.json({ mode, ...summary, accepted, tokens, cases });
}
