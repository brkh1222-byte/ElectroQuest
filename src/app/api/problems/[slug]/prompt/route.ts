import { z } from "zod";
import { jsonError, mapLimit, parseBody, requireUserAndProblem } from "@/lib/api";
import { recordSubmission } from "@/db/submissions";
import { chat, modelErrorMessage, resolveModel } from "@/lib/llm";
import { consumeQuota } from "@/lib/quota";
import { aggregate, scoreCase, type CaseResult } from "@/lib/scoring";

const bodySchema = z.object({
  mode: z.enum(["run", "submit"]),
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
});

// Prompt problems are graded fully server-side: hidden inputs never reach the client (spec §3.1).
export async function POST(req: Request, ctx: RouteContext<"/api/problems/[slug]/prompt">) {
  const { slug } = await ctx.params;
  const loaded = await requireUserAndProblem(slug, ["prompt"]);
  if ("error" in loaded) return loaded.error;
  const { user, problem } = loaded;

  const body = await parseBody(req, bodySchema);
  if (!body) return jsonError(400, "Invalid request.");
  const model = resolveModel(problem.config, body.model);
  if (!model) return jsonError(400, "That model isn't allowed for this problem.");
  if (!(await consumeQuota(user.id, body.mode))) {
    return jsonError(429, `Daily ${body.mode} limit reached. It resets at 00:00 UTC.`);
  }

  const tests = body.mode === "run" ? problem.visibleTests : problem.hiddenTests;
  const metric = problem.config.metric ?? "label_accuracy";
  let inputTokens = 0;
  let outputTokens = 0;

  const results = await mapLimit(tests, 5, async (test): Promise<CaseResult> => {
    try {
      const reply = await chat({
        model,
        messages: [
          { role: "system", content: body.prompt },
          { role: "user", content: test.input ?? "" },
        ],
        maxOutputTokens: problem.config.limits.maxOutputTokens,
      });
      inputTokens += reply.inputTokens;
      outputTokens += reply.outputTokens;
      return { id: test.id, passed: scoreCase(metric, test, reply.text), actual: reply.text };
    } catch (err) {
      return { id: test.id, passed: false, actual: null, error: modelErrorMessage(err) };
    }
  });

  const summary = aggregate(results);
  const accepted = summary.score >= (problem.config.threshold ?? 1);
  const tokens = inputTokens + outputTokens;

  if (body.mode === "run") {
    // Visible cases: show everything so the learner can debug.
    const cases = results.map((r, i) => ({ ...r, input: tests[i].input, expected: tests[i].expected }));
    return Response.json({ mode: "run", ...summary, tokens, cases });
  }

  await recordSubmission({
    userId: user.id,
    slug,
    kind: "submit",
    content: body.prompt,
    score: summary.score,
    tokens,
    accepted,
  });
  // Hidden cases: pass/fail per case only, never inputs or expected outputs.
  const cases = results.map((r) => ({ id: r.id, passed: r.passed, error: r.error }));
  return Response.json({ mode: "submit", ...summary, accepted, tokens, cases });
}
