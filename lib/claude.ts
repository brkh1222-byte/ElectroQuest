import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaContentBlockParam, BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { TASKS, type Lang, type TaskName } from "./ai-tasks";

/** Prompt file versions. Bump a version by adding prompts/<task>.v2.md and changing it here. */
export const PROMPT_VERSIONS: Record<TaskName | "_system", string> = {
  _system: "v1",
  ping: "v1",
  read_marking: "v1",
  resistor_bands: "v1",
  interpret_answer: "v1",
  read_multimeter: "v1",
  board_defects: "v1",
  golden_compare: "v1",
  ask: "v1",
};

const MODELS = {
  fast: process.env.CLAUDE_MODEL_FAST || "claude-haiku-5-5",
  strong: process.env.CLAUDE_MODEL_STRONG || "claude-opus-5-5",
};
type Effort = "low" | "medium" | "high";
const EFFORT: Record<"fast" | "strong", Effort> = {
  fast: (process.env.CLAUDE_EFFORT_FAST as Effort) || "low",
  strong: (process.env.CLAUDE_EFFORT_STRONG as Effort) || "low",
};
/** Server-side refusal fallback is only offered on these model families. */
const SUPPORTS_FALLBACK = /^claude-(opus|sonnet|fable)-/;

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

const promptCache = new Map<string, string>();
async function loadPrompt(name: string, version: string): Promise<string> {
  const key = `${name}.${version}`;
  if (!promptCache.has(key)) {
    const text = await fs.readFile(path.join(process.cwd(), "prompts", `${key}.md`), "utf8");
    promptCache.set(key, text);
  }
  return promptCache.get(key)!;
}

const LANG_NAME: Record<Lang, string> = { mn: "Mongolian (Cyrillic)", en: "English" };

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function imageBlock(dataUrl: string): BetaContentBlockParam {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error("bad image data");
  return {
    type: "image",
    source: { type: "base64", media_type: m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: m[2] },
  };
}

/** Turn a validated task input into the user message content. Images go first, then a JSON block of the rest. */
function buildContent(task: TaskName, input: Record<string, unknown>): BetaContentBlockParam[] {
  const blocks: BetaContentBlockParam[] = [];
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string" && v.startsWith("data:image/")) {
      blocks.push({ type: "text", text: `Image "${k}":` });
      blocks.push(imageBlock(v));
    } else if (task === "ask" && k === "history") {
      // history is sent as real turns, see below
    } else {
      rest[k] = v;
    }
  }
  blocks.push({ type: "text", text: "Input:\n" + JSON.stringify(rest, null, 2) });
  return blocks;
}

export class TaskError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

export async function runTask(task: TaskName, lang: Lang, rawInput: unknown) {
  const def = TASKS[task];
  const parsedInput = def.input.safeParse(rawInput);
  if (!parsedInput.success) throw new TaskError(`invalid input: ${parsedInput.error.message}`, 400);

  const input = parsedInput.data as Record<string, unknown>;
  const system = fill(
    (await loadPrompt("_system", PROMPT_VERSIONS._system)) + "\n\n" + (await loadPrompt(task, PROMPT_VERSIONS[task])),
    { lang: LANG_NAME[lang] },
  );
  const model = MODELS[def.tier];
  const messages: BetaMessageParam[] = [];
  if (task === "ask") {
    for (const h of (input.history as { role: "user" | "assistant"; text: string }[]) ?? []) {
      messages.push({ role: h.role, content: h.text });
    }
  }
  messages.push({ role: "user", content: buildContent(task, input) });

  let lastError = "";
  // Ask once; if the JSON fails validation, ask again once with the error, then give up.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const convo: BetaMessageParam[] =
      attempt === 1
        ? messages
        : [
            ...messages,
            {
              role: "user",
              content: `Your previous answer did not match the required JSON schema (${lastError}). Reply again with valid JSON only.`,
            },
          ];
    const fallback = SUPPORTS_FALLBACK.test(model)
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {};
    let res;
    try {
      res = await getClient().beta.messages.create({
        model,
        max_tokens: def.tier === "strong" ? 8000 : 2000,
        system,
        messages: convo,
        output_config: { effort: EFFORT[def.tier], format: betaZodOutputFormat(def.output) },
        ...fallback,
      });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) throw new TaskError("Claude is busy (rate limited). Try again in a moment.", 429);
      if (e instanceof Anthropic.AuthenticationError) throw new TaskError("Claude API key is invalid", 503);
      if (e instanceof Anthropic.BadRequestError) {
        // Surface the API's own message ("credit balance is too low", "image too large"…), not the raw JSON.
        const detail = (e.error as { error?: { message?: string } } | undefined)?.error?.message ?? e.message;
        // An account problem is the server's fault, not the request's: report it as unavailable so the UI offers retry/replay.
        if (/credit balance/i.test(detail)) throw new TaskError(`Claude account has no credits: ${detail}`, 503);
        throw new TaskError(`Claude rejected the request: ${detail}`, 400);
      }
      if (e instanceof Anthropic.APIConnectionError) throw new TaskError("Can't reach Claude (network)", 503);
      if (e instanceof Anthropic.APIError) throw new TaskError(`Claude error ${e.status}`, 502);
      // Anything else before a response, e.g. no API key configured on the server.
      throw new TaskError(`Claude is not available: ${e instanceof Error ? e.message : String(e)}`, 503);
    }
    if (res.stop_reason === "refusal") throw new TaskError("Claude declined this request", 422);
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    try {
      const out = def.output.safeParse(JSON.parse(text));
      if (out.success) return { data: out.data, model: res.model, attempts: attempt };
      lastError = out.error.message.slice(0, 300);
    } catch {
      lastError = "not valid JSON";
    }
  }
  throw new TaskError(`Claude returned invalid output twice: ${lastError}`, 502);
}
