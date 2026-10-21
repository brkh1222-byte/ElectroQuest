// Grades a system prompt on a set of test cases. Shared by the prompt route and
// scripts/check-prompt-problem.ts, so imports stay relative with .ts extensions.
import type { LearnerSettings, ProblemConfig, TestCase } from "./problems/schema";
import { resolveSettings } from "./problems/settings.ts";
import { aggregate, scoreCase, type CaseResult } from "./scoring.ts";

export type ModelCall = (opts: {
  system: string;
  input: string;
  temperature: number;
  maxOutputTokens: number;
}) => Promise<{ text: string; inputTokens: number; outputTokens: number }>;

export type PromptCaseResult = CaseResult & { replies?: string[] };

export async function gradePrompt(opts: {
  config: ProblemConfig;
  prompt: string;
  settings?: LearnerSettings;
  tests: TestCase[];
  call: ModelCall;
  /** Runs a list of tasks, e.g. with a concurrency cap. Defaults to one at a time. */
  map?: <T, R>(items: T[], fn: (item: T) => Promise<R>) => Promise<R[]>;
  onError?: (err: unknown) => string;
}) {
  const { config, tests, call } = opts;
  const settings = resolveSettings(config, opts.settings);
  const metric = config.metric ?? "label_accuracy";
  const map = opts.map ?? (async (items, fn) => { const out = []; for (const i of items) out.push(await fn(i)); return out; });
  let inputTokens = 0;
  let outputTokens = 0;
  let calls = 0;

  const results = await map(tests, async (test): Promise<PromptCaseResult> => {
    try {
      // `repeat` runs: the case passes only if every run passes, so randomness costs points.
      const replies: string[] = [];
      for (let i = 0; i < config.repeat; i++) {
        const reply = await call({ system: opts.prompt, input: test.input ?? "", ...settings });
        inputTokens += reply.inputTokens;
        outputTokens += reply.outputTokens;
        calls++;
        replies.push(reply.text);
      }
      const passed = replies.every((r) => scoreCase(metric, test, r));
      return { id: test.id, passed, actual: replies[0], replies: config.repeat > 1 ? replies : undefined };
    } catch (err) {
      return { id: test.id, passed: false, actual: null, error: opts.onError?.(err) ?? String(err) };
    }
  });

  const summary = aggregate(results);
  const avgOutputTokens = calls ? outputTokens / calls : 0;
  const overBudget = config.tokenBudget !== undefined && avgOutputTokens > config.tokenBudget;
  const accepted = summary.score >= (config.threshold ?? 1) && !overBudget;
  return {
    ...summary,
    results,
    accepted,
    overBudget,
    avgOutputTokens: Math.round(avgOutputTokens * 10) / 10,
    tokenBudget: config.tokenBudget,
    tokens: inputTokens + outputTokens,
    settings,
  };
}
