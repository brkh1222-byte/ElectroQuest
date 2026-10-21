import "server-only";

import { embedMany, generateText, type ModelMessage } from "ai";
import type { ProblemConfig } from "./problems/schema";

// Small, cheap models via Vercel AI Gateway (spec §5). Verify slugs against the gateway's model list.
export const DEFAULT_MODEL = process.env.EVALQUEST_DEFAULT_MODEL ?? "google/gemini-2.5-flash-lite";
export const EMBEDDING_MODEL = process.env.EVALQUEST_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";

/** Models a problem allows. A single model = fixed; a list = "open model" problem. */
export function allowedModels(config: ProblemConfig) {
  const models = config.model === undefined ? ["default"] : [config.model].flat();
  return models.map((m) => (m === "default" ? DEFAULT_MODEL : m));
}

export function resolveModel(config: ProblemConfig, requested?: string | null) {
  const allowed = allowedModels(config);
  if (!requested) return allowed[0];
  return allowed.includes(requested) ? requested : null;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(opts: {
  model: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  /** Fixed at 0 unless the problem lets the learner change it. */
  temperature?: number;
}) {
  // AI SDK 7 takes system text as `instructions`; learner-supplied system messages are moved there.
  const instructions = opts.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const messages: ModelMessage[] = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const result = await generateText({
    model: opts.model,
    instructions: instructions || undefined,
    messages,
    temperature: opts.temperature ?? 0,
    maxOutputTokens: opts.maxOutputTokens,
  });
  return {
    text: result.text,
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
  };
}

/** Learner-facing message for a failed model call; provider details only go to server logs. */
export function modelErrorMessage(err: unknown) {
  console.error("[llm] model call failed:", err);
  return "The model call failed. Please try again in a moment.";
}

export async function embedTexts(texts: string[]) {
  const result = await embedMany({ model: EMBEDDING_MODEL, values: texts });
  return { embeddings: result.embeddings, inputTokens: result.usage.tokens ?? 0 };
}
