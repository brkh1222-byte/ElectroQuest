import { z } from "zod";
import { jsonError, parseBody, requireUserAndProblem } from "@/lib/api";
import { consumeQuota } from "@/lib/quota";
import { createSession } from "@/lib/sessions";

const bodySchema = z.object({ mode: z.enum(["run", "submit"]) });

/**
 * Starts a pipeline attempt (spec §6). Returns a session token for the LLM proxy and the
 * test *inputs*. Expected outputs stay on the server and are only used by /score.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/problems/[slug]/session">) {
  const { slug } = await ctx.params;
  const loaded = await requireUserAndProblem(slug, ["pipeline"]);
  if ("error" in loaded) return loaded.error;
  const { user, problem } = loaded;

  const body = await parseBody(req, bodySchema);
  if (!body) return jsonError(400, "Invalid request.");
  if (!(await consumeQuota(user.id, body.mode))) {
    return jsonError(429, `Daily ${body.mode} limit reached. It resets at 00:00 UTC.`);
  }

  const { token, claims } = await createSession(user.id, slug, body.mode);
  const tests = body.mode === "run" ? problem.visibleTests : problem.hiddenTests;
  return Response.json({
    token,
    expiresAt: claims.exp,
    cases: tests.map((t) => ({ id: t.id, args: t.args ?? [] })),
  });
}
