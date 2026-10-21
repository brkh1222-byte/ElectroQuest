import { z } from "zod";
import { jsonError, mapLimit, parseBody, requireUserAndProblem, settingsSchema } from "@/lib/api";
import { hasRevealedAnswer } from "@/db/answers";
import { recordSubmission } from "@/db/submissions";
import { findAnswerLock } from "@/lib/contests";
import { gradePrompt } from "@/lib/grade-prompt";
import { chat, modelErrorMessage, resolveModel } from "@/lib/llm";
import { consumeQuota } from "@/lib/quota";

const bodySchema = z.object({
  mode: z.enum(["run", "submit"]),
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
  settings: settingsSchema,
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
  const graded = await gradePrompt({
    config: problem.config,
    prompt: body.prompt,
    settings: body.settings,
    tests,
    map: (items, fn) => mapLimit(items, 5, fn),
    onError: modelErrorMessage,
    call: ({ system, input, temperature, maxOutputTokens }) =>
      chat({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input },
        ],
        temperature,
        maxOutputTokens,
      }),
  });
  const { results, passed, total, score, accepted, overBudget, avgOutputTokens, tokenBudget, tokens } = graded;
  const summary = { passed, total, score, tokens, avgOutputTokens, tokenBudget, overBudget };

  if (body.mode === "run") {
    // Visible cases: show everything so the learner can debug.
    const cases = results.map((r, i) => ({ ...r, input: tests[i].input, expected: tests[i].expected }));
    return Response.json({ mode: "run", ...summary, cases });
  }

  await recordSubmission({
    userId: user.id,
    slug,
    kind: "submit",
    content: body.prompt,
    settings: { ...graded.settings, model },
    score,
    tokens,
    accepted,
    // Seeing the answer first keeps the solve but takes the learner off the leaderboard.
    ranked: !(await hasRevealedAnswer(user.id, slug)),
  });
  // Tells a contest participant that this Accepted submit scored for their running contest.
  const contest = accepted ? await findAnswerLock(user.id, slug).catch(() => null) : null;
  // Hidden cases: pass/fail per case only, never inputs or expected outputs.
  const cases = results.map((r) => ({ id: r.id, passed: r.passed, error: r.error }));
  return Response.json({ mode: "submit", ...summary, accepted, cases, contest: contest && { slug: contest.slug, title: contest.title } });
}
