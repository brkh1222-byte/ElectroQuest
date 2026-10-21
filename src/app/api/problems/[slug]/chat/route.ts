import { z } from "zod";
import { jsonError, parseBody, requireUserAndProblem, settingsSchema } from "@/lib/api";
import { chat, modelErrorMessage, resolveModel } from "@/lib/llm";
import { resolveSettings } from "@/lib/problems/settings";
import { consumeQuota } from "@/lib/quota";

const bodySchema = z.object({
  prompt: z.string().max(8000),
  model: z.string().optional(),
  settings: settingsSchema,
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .min(1)
    .max(20),
});

// "Scratch chat" tab for prompt problems: try the prompt freely. Counts as a Run.
export async function POST(req: Request, ctx: RouteContext<"/api/problems/[slug]/chat">) {
  const { slug } = await ctx.params;
  const loaded = await requireUserAndProblem(slug, ["prompt"]);
  if ("error" in loaded) return loaded.error;
  const { user, problem } = loaded;

  const body = await parseBody(req, bodySchema);
  if (!body) return jsonError(400, "Invalid request.");
  const model = resolveModel(problem.config, body.model);
  if (!model) return jsonError(400, "That model isn't allowed for this problem.");
  if (!(await consumeQuota(user.id, "run"))) return jsonError(429, "Daily run limit reached.");

  // Exposed settings apply here too, so lessons can show what temperature does.
  const settings = resolveSettings(problem.config, body.settings);
  const exposesTokens = problem.config.settings.maxOutputTokens !== undefined;
  try {
    const reply = await chat({
      model,
      messages: [{ role: "system", content: body.prompt }, ...body.messages],
      temperature: settings.temperature,
      maxOutputTokens: exposesTokens ? settings.maxOutputTokens : Math.max(settings.maxOutputTokens, 256),
    });
    return Response.json(reply);
  } catch (err) {
    return jsonError(502, modelErrorMessage(err));
  }
}
