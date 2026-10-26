import "server-only";
import type { Lang, TaskName } from "./ai-tasks";
import * as claude from "./claude";
import * as gemini from "./gemini";

export { TaskError } from "./ai-prompt";

/** Which model provider answers /api/ai: "gemini" (default, free tier) or "claude". */
const provider = process.env.AI_PROVIDER === "claude" ? claude : gemini;

export function runTask(task: TaskName, lang: Lang, rawInput: unknown) {
  return provider.runTask(task, lang, rawInput);
}
