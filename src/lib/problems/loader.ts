import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { parse as parseYaml } from "yaml";
import { allowedModels } from "../llm";
import {
  problemConfigSchema,
  testCaseSchema,
  type Hint,
  type LearnerSettings,
  type Problem,
  type ProblemSummary,
  type PublicProblem,
  type TestCase,
} from "./schema";

const PROBLEMS_DIR = path.join(process.cwd(), "problems");
const SLUG_RE = /^[a-z0-9-]+$/;

async function readOptional(file: string) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return "";
  }
}

function parseJsonl(text: string): TestCase[] {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => testCaseSchema.parse(JSON.parse(line)));
}

function parseHints(md: string): Hint[] {
  return md
    .split(/^## /m)
    .filter((s) => s.trim())
    .map((section) => {
      const [title, ...rest] = section.split("\n");
      return { title: title.trim(), body: rest.join("\n").trim() };
    });
}

async function loadProblem(slug: string): Promise<Problem | null> {
  if (!SLUG_RE.test(slug)) return null;
  const dir = path.join(PROBLEMS_DIR, slug);
  const yaml = await readOptional(path.join(dir, "problem.yaml"));
  if (!yaml) return null;

  const config = problemConfigSchema.parse(parseYaml(yaml));
  // The Editorial is the answer: it is split from the hints and only served behind a warning.
  const allHints = parseHints(await readOptional(path.join(dir, "hints.md")));
  const editorial = allHints.find((h) => h.title === "Editorial")?.body ?? "";
  const starterFile = config.type === "prompt" ? "starter_prompt.md" : "starter.py";

  const fixtures: Record<string, unknown> = {};
  for (const [name, file] of Object.entries(config.fixtures)) {
    fixtures[name] = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  }

  return {
    slug,
    config,
    statement: await readOptional(path.join(dir, "statement.md")),
    lesson: await readOptional(path.join(dir, "lesson.md")),
    hints: allHints.filter((h) => h.title !== "Editorial"),
    editorial,
    starter: await readOptional(path.join(dir, starterFile)),
    fixtures,
    visibleTests: parseJsonl(await readOptional(path.join(dir, "tests/visible.jsonl"))),
    hiddenTests: parseJsonl(await readOptional(path.join(dir, "tests/hidden.jsonl"))),
  };
}

/** Full problem including hidden tests. Never pass the result to a client component. */
export async function getProblem(slug: string) {
  "use cache";
  cacheLife("hours");
  return loadProblem(slug);
}

export async function getPublicProblem(slug: string): Promise<PublicProblem | null> {
  const problem = await getProblem(slug);
  if (!problem) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the editorial is the answer; never ship it
  const { hiddenTests, editorial, ...rest } = problem;
  const pub = { ...rest, models: allowedModels(problem.config) };
  return problem.config.type === "scratch" ? { ...pub, hiddenTests } : pub;
}

export async function listProblems(): Promise<ProblemSummary[]> {
  "use cache";
  cacheLife("hours");
  const entries = await readdir(PROBLEMS_DIR, { withFileTypes: true });
  const problems = await Promise.all(
    entries.filter((e) => e.isDirectory()).map((e) => loadProblem(e.name)),
  );
  return problems
    .filter((p): p is Problem => p !== null)
    .map((p) => ({
      slug: p.slug,
      title: p.config.title,
      type: p.config.type,
      difficulty: p.config.difficulty,
      tags: p.config.tags,
    }));
}

/** The reference solution and its explanation: what "Show answer" reveals. */
export async function getAnswer(slug: string) {
  const problem = await getProblem(slug);
  if (!problem) return null;
  const file = problem.config.type === "prompt" ? "reference/prompt.md" : "reference/solution.py";
  const reference = await readOptional(path.join(PROBLEMS_DIR, slug, file));
  const settings = problem.config.type === "prompt" ? await readOptional(path.join(PROBLEMS_DIR, slug, "reference/settings.yaml")) : "";
  return {
    editorial: problem.editorial,
    reference: reference.trim(),
    settings: settings ? (parseYaml(settings) as LearnerSettings) : null,
  };
}
