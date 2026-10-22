"use client";

import type { AiResponse, Lang, TaskInput, TaskName, TaskOutput } from "./ai-tasks";
import { store } from "./db";
import { isDemo } from "./demo";
import cannedRaw from "@/data/demo/claude-cache.json";

const CANNED = cannedRaw as Record<string, unknown>;

export class AiError extends Error {
  constructor(
    message: string,
    public offline = false,
  ) {
    super(message);
  }
}

/** Keep the debug log readable: images become "[image 84KB]". */
function summarize(input: unknown): string {
  return JSON.stringify(input, (_k, v) =>
    typeof v === "string" && v.startsWith("data:image/") ? `[image ${Math.round(v.length / 1365)}KB]` : v,
  ).slice(0, 2000);
}

async function log(entry: Parameters<typeof store.put<"ailog">>[1]) {
  try {
    await store.put("ailog", entry);
  } catch {}
}

/**
 * Call a Claude task through /api/ai. The API key never leaves the server.
 * `demoKey` marks a call on the scripted demo path: in demo mode a successful answer is recorded
 * under that key, and replayed (or a canned answer used) if the live call fails.
 */
export async function ai<T extends TaskName>(
  task: T,
  input: TaskInput<T>,
  opts: { lang: Lang; demoKey?: string; signal?: AbortSignal },
): Promise<TaskOutput<T>> {
  const demo = isDemo() && !!opts.demoKey;
  const t0 = performance.now();
  let error: AiError;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) throw new AiError("offline", true);
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task, lang: opts.lang, input }),
      signal: opts.signal,
    });
    const body = (await r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` }))) as AiResponse<TaskOutput<T>>;
    if (!body.ok || !body.data) throw new AiError(body.error ?? `HTTP ${r.status}`, r.status === 503);
    await log({ ts: Date.now(), task, ok: true, ms: Math.round(performance.now() - t0), model: body.model, source: "live", demoKey: opts.demoKey, input: summarize(input), output: JSON.stringify(body.data) });
    if (demo) await store.put("demo_cache", { key: opts.demoKey!, task, data: body.data, recordedAt: Date.now() });
    return body.data;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    error = e instanceof AiError ? e : new AiError(e instanceof Error ? e.message : String(e), true);
  }

  if (demo) {
    const recorded = await store.get("demo_cache", opts.demoKey!);
    const data = recorded?.data ?? CANNED[opts.demoKey!];
    if (data) {
      await log({ ts: Date.now(), task, ok: true, ms: Math.round(performance.now() - t0), source: recorded ? "replay" : "canned", demoKey: opts.demoKey, input: summarize(input), output: JSON.stringify(data) });
      return data as TaskOutput<T>;
    }
  }
  await log({ ts: Date.now(), task, ok: false, ms: Math.round(performance.now() - t0), source: "live", demoKey: opts.demoKey, input: summarize(input), output: error.message });
  throw error;
}
