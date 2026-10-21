// Grades a prompt problem's reference prompt (and optionally its starter) on all of its tests,
// the same way the server does. Spec §11: the reference must pass before a problem is published.
//
//   npm run check:prompt -- <slug> [<slug> ...] [--starter]
//
// Needs AI Gateway access: `vercel env pull` (OIDC) or AI_GATEWAY_API_KEY in .env.local.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { parse as parseYaml } from "yaml";
import { gradePrompt } from "../src/lib/grade-prompt.ts";
import { problemConfigSchema, type TestCase } from "../src/lib/problems/schema.ts";

const DEFAULT_MODEL = process.env.EVALQUEST_DEFAULT_MODEL ?? "google/gemini-2.5-flash-lite";


async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= 12 || !String(err).includes("Rate limit")) throw err;
      await new Promise((r) => setTimeout(r, 15_000));
    }
  }
}

const readJsonl = async (file: string): Promise<TestCase[]> =>
  (await readFile(file, "utf8"))
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

async function check(slug: string, which: "reference" | "starter") {
  const dir = path.join("problems", slug);
  const config = problemConfigSchema.parse(parseYaml(await readFile(path.join(dir, "problem.yaml"), "utf8")));
  if (config.type !== "prompt") throw new Error(`${slug} is not a prompt problem`);
  const prompt = await readFile(path.join(dir, which === "reference" ? "reference/prompt.md" : "starter_prompt.md"), "utf8");
  // The reference may declare the settings it was tuned with; the starter uses the defaults.
  const settingsFile = which === "reference" ? await readFile(path.join(dir, "reference/settings.yaml"), "utf8").catch(() => "") : "";
  const settings = settingsFile ? parseYaml(settingsFile) : {};
  const models = !config.model || config.model === "default" ? [DEFAULT_MODEL] : [config.model].flat().map((m) => (m === "default" ? DEFAULT_MODEL : m));
  const model = settings.model ?? models[0];
  const tests = [...(await readJsonl(path.join(dir, "tests/visible.jsonl"))), ...(await readJsonl(path.join(dir, "tests/hidden.jsonl")))];

  // One call at a time (the default map): low gateway rate limits would fail a parallel burst.
  const graded = await gradePrompt({
    config,
    prompt,
    settings,
    tests,
    call: ({ system, input, temperature, maxOutputTokens }) =>
      withRateLimitRetry(() =>
        generateText({ model, instructions: system, messages: [{ role: "user", content: input }], temperature, maxOutputTokens, maxRetries: 0 }),
      ).then((r) => ({ text: r.text, inputTokens: r.usage.inputTokens ?? 0, outputTokens: r.usage.outputTokens ?? 0 })),
  });
  const { passed, total, score, accepted, avgOutputTokens, tokenBudget } = graded;
  const ok = which === "reference" ? accepted : !accepted;
  const budget = tokenBudget ? `, avg ${avgOutputTokens}/${tokenBudget} output tokens` : "";
  console.log(`${ok ? "✓" : "✗"} ${slug} ${which}: ${passed}/${total} (${Math.round(score * 100)}%, threshold ${(config.threshold ?? 1) * 100}%${budget})`);
  for (const r of graded.results.filter((r) => !r.passed)) {
    const t = tests.find((t) => t.id === r.id)!;
    const got = r.error ?? (r.replies ?? [String(r.actual)]).map((x) => x.slice(-120)).join(" | ");
    console.log(`    ${r.id}: expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(got)}`);
  }
  return ok;
}

const args = process.argv.slice(2);
const slugs = args.filter((a) => !a.startsWith("--"));
let ok = true;
for (const slug of slugs) {
  ok = (await check(slug, "reference")) && ok;
  // A starter that already passes means the problem teaches nothing.
  if (args.includes("--starter")) ok = (await check(slug, "starter")) && ok;
}
process.exit(ok ? 0 : 1);
