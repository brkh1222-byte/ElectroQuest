import "server-only";
import { z } from "zod";
import { TASKS, type Lang, type TaskName } from "./ai-tasks";
import { buildParts, parseImage, RETRY_MESSAGE, systemPrompt, TaskError } from "./ai-prompt";

const MODELS = {
  fast: process.env.GEMINI_MODEL_FAST || "gemini-3.5-flash-lite",
  // gemini-3.8-flash timed out (>90s) on board photos in testing; 3.5 answers in ~5s.
  strong: process.env.GEMINI_MODEL_STRONG || "gemini-3.5-flash",
};
type Thinking = "minimal" | "low" | "medium" | "high";
const THINKING: Record<"fast" | "strong", Thinking> = {
  fast: (process.env.GEMINI_THINKING_FAST as Thinking) || "low",
  strong: (process.env.GEMINI_THINKING_STRONG as Thinking) || "low",
};
const API = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };
interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  modelVersion?: string;
  error?: { code: number; message: string; status: string };
}

function toParts(task: TaskName, input: Record<string, unknown>): GeminiPart[] {
  return buildParts(task, input).map((p) => {
    if (p.kind === "text") return { text: p.text };
    const { mediaType, data } = parseImage(p.dataUrl);
    return { inlineData: { mimeType: mediaType, data } };
  });
}

/** Output schema as plain JSON Schema (Gemini's responseJsonSchema rejects the $schema key). */
function jsonSchema(schema: z.ZodType) {
  const out = z.toJSONSchema(schema) as Record<string, unknown>;
  delete out.$schema;
  return out;
}

/** Free-tier models are often briefly overloaded (HTTP 503); runTask then falls back to the fast model. */
class OverloadedError extends TaskError {
  constructor(model: string) {
    super(`Gemini is busy (${model} overloaded). Try again in a moment.`, 503);
  }
}

async function generate(model: string, body: unknown): Promise<GeminiResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new TaskError("Gemini is not available: GEMINI_API_KEY is not set", 503);
  // One retry on overload or a dropped connection, like the Claude client's maxRetries: 1.
  for (let attempt = 1; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${API}/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      if (attempt < 2) continue;
      throw new TaskError("Can't reach Gemini (network)", 503);
    }
    const json = (await res.json().catch(() => ({}))) as GeminiResponse;
    if (res.ok) return json;
    const detail = json.error?.message ?? `HTTP ${res.status}`;
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    if (res.status === 429) throw new TaskError("Gemini is busy (rate limited). Try again in a moment.", 429);
    if (res.status === 401 || res.status === 403 || /API key/i.test(detail)) throw new TaskError("Gemini API key is invalid", 503);
    if (res.status === 400) throw new TaskError(`Gemini rejected the request: ${detail}`, 400);
    if (res.status === 404) throw new TaskError(`Gemini model ${model} is not available: ${detail}`, 503);
    if (res.status === 503) throw new OverloadedError(model);
    throw new TaskError(`Gemini error ${res.status}`, 502);
  }
}

export async function runTask(task: TaskName, lang: Lang, rawInput: unknown) {
  const def = TASKS[task];
  const parsedInput = def.input.safeParse(rawInput);
  if (!parsedInput.success) throw new TaskError(`invalid input: ${parsedInput.error.message}`, 400);

  const input = parsedInput.data as Record<string, unknown>;
  const model = MODELS[def.tier];
  const contents: GeminiContent[] = [];
  if (task === "ask") {
    for (const h of (input.history as { role: "user" | "assistant"; text: string }[]) ?? []) {
      contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] });
    }
  }
  contents.push({ role: "user", parts: toParts(task, input) });
  const config = {
    systemInstruction: { parts: [{ text: systemPrompt(task, lang) }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema(def.output),
      // Thinking tokens count toward this limit, so leave room beyond the answer itself.
      maxOutputTokens: def.tier === "strong" ? 16000 : 4000,
      thinkingConfig: { thinkingLevel: THINKING[def.tier] },
    },
  };

  let lastError = "";
  // Ask once; if the JSON fails validation, ask again once with the error, then give up.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const convo: GeminiContent[] =
      attempt === 1 ? contents : [...contents, { role: "user", parts: [{ text: RETRY_MESSAGE(lastError) }] }];
    const body = { ...config, contents: convo };
    let res: GeminiResponse;
    try {
      res = await generate(model, body);
    } catch (e) {
      if (!(e instanceof OverloadedError) || model === MODELS.fast) throw e;
      res = await generate(MODELS.fast, body);
    }
    const candidate = res.candidates?.[0];
    if (res.promptFeedback?.blockReason || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST"].includes(candidate?.finishReason ?? "")) {
      throw new TaskError("Gemini declined this request", 422);
    }
    const text = (candidate?.content?.parts ?? []).flatMap((p) => (p.text && !p.thought ? [p.text] : [])).join("");
    try {
      const out = def.output.safeParse(JSON.parse(text));
      if (out.success) return { data: out.data, model: res.modelVersion ?? model, attempts: attempt };
      lastError = out.error.message.slice(0, 300);
    } catch {
      lastError = candidate?.finishReason === "MAX_TOKENS" ? "answer was cut off" : "not valid JSON";
    }
  }
  throw new TaskError(`Gemini returned invalid output twice: ${lastError}`, 502);
}
