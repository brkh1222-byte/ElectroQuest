import { z } from "zod";
import { jsonError, parseBody } from "@/lib/api";
import { embedTexts, modelErrorMessage } from "@/lib/llm";
import { bearerToken, verifySession } from "@/lib/sessions";

const bodySchema = z.object({
  texts: z.array(z.string().max(8000)).min(1).max(100),
});

// Embedding proxy for learner code. Embedding tokens count toward the session's total.
export async function POST(req: Request) {
  const session = verifySession(bearerToken(req));
  if (!session || session.scored) return jsonError(401, "Session expired. Run again.");

  const body = await parseBody(req, bodySchema);
  if (!body) return jsonError(400, "Invalid request.");

  let result;
  try {
    result = await embedTexts(body.texts);
  } catch (err) {
    return jsonError(502, modelErrorMessage(err));
  }
  session.inputTokens += result.inputTokens;
  return Response.json(result);
}
