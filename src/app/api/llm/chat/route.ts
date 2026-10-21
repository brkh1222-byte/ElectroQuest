import { z } from "zod";
import { jsonError, parseBody } from "@/lib/api";
import { chat, modelErrorMessage, resolveModel } from "@/lib/llm";
import { getProblem } from "@/lib/problems/loader";
import { addUsage, bearerToken, claimCall, verifySession } from "@/lib/sessions";

const bodySchema = z.object({
  caseId: z.string(),
  model: z.string().nullish(),
  messages: z
    .array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().max(20_000) }))
    .min(1)
    .max(30),
});

// LLM proxy for learner code running in Pyodide. Keys stay server-side; usage is metered per session.
export async function POST(req: Request) {
  const session = await verifySession(bearerToken(req));
  if (!session || session.scored) return jsonError(401, "Session expired. Run again.");
  const problem = await getProblem(session.claims.slug);
  if (!problem) return jsonError(404, "Problem not found.");

  const body = await parseBody(req, bodySchema);
  if (!body) return jsonError(400, "Invalid request.");
  const model = resolveModel(problem.config, body.model);
  if (!model) return jsonError(400, "That model isn't allowed for this problem.");

  const { maxCallsPerCase } = problem.config.limits;
  if (!(await claimCall(session.claims.sid, body.caseId, maxCallsPerCase))) {
    return jsonError(429, `At most ${maxCallsPerCase} model calls per test case.`);
  }

  let reply;
  try {
    reply = await chat({ model, messages: body.messages, maxOutputTokens: problem.config.limits.maxOutputTokens });
  } catch (err) {
    return jsonError(502, modelErrorMessage(err));
  }
  await addUsage(session.claims.sid, reply.inputTokens, reply.outputTokens);
  return Response.json(reply);
}
