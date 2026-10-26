import "server-only";
import type { Lang, TaskName } from "./ai-tasks";
import { prompts } from "./generated/data-index";

/** Prompt file versions. Bump a version by adding prompts/<task>.v2.md and changing it here. */
export const PROMPT_VERSIONS: Record<TaskName | "_system", string> = {
  _system: "v2",
  ping: "v1",
  read_marking: "v1",
  resistor_bands: "v1",
  interpret_answer: "v1",
  read_multimeter: "v1",
  board_defects: "v1",
  golden_compare: "v1",
  repair_advice: "v1",
  ask: "v1",
};

const LANG_NAME: Record<Lang, string> = { mn: "Mongolian (Cyrillic)", en: "English" };

function loadPrompt(name: string, version: string): string {
  const text = prompts[`${name}.${version}`];
  if (text === undefined) throw new Error(`missing prompt prompts/${name}.${version}.md`);
  return text;
}

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

/** The shared system prompt plus the task's own prompt, in the answer language. */
export function systemPrompt(task: TaskName, lang: Lang) {
  return fill(loadPrompt("_system", PROMPT_VERSIONS._system) + "\n\n" + loadPrompt(task, PROMPT_VERSIONS[task]), {
    lang: LANG_NAME[lang],
  });
}

/** Split a data URL into its media type and base64 payload. */
export function parseImage(dataUrl: string) {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error("bad image data");
  return { mediaType: m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: m[2] };
}

export type Part = { kind: "text"; text: string } | { kind: "image"; dataUrl: string };

/** Turn a validated task input into the user message parts. Images go first, then a JSON block of the rest. */
export function buildParts(task: TaskName, input: Record<string, unknown>): Part[] {
  const parts: Part[] = [];
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string" && v.startsWith("data:image/")) {
      parts.push({ kind: "text", text: `Image "${k}":` });
      parts.push({ kind: "image", dataUrl: v });
    } else if (task === "ask" && k === "history") {
      // history is sent as real turns by each provider
    } else {
      rest[k] = v;
    }
  }
  parts.push({ kind: "text", text: "Input:\n" + JSON.stringify(rest, null, 2) });
  return parts;
}

export const RETRY_MESSAGE = (error: string) =>
  `Your previous answer did not match the required JSON schema (${error}). Reply again with valid JSON only.`;

export class TaskError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}
