import { z } from "zod";

export const problemTypes = ["prompt", "pipeline", "scratch"] as const;
export type ProblemType = (typeof problemTypes)[number];

export const metrics = ["label_accuracy", "contains_any", "final_answer"] as const;
export type Metric = (typeof metrics)[number];

const rangeSetting = z.object({ default: z.number(), min: z.number(), max: z.number() });
export type RangeSetting = z.infer<typeof rangeSetting>;

// Shape of problems/<slug>/problem.yaml
export const problemConfigSchema = z.object({
  title: z.string(),
  type: z.enum(problemTypes),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([]),
  // Reserves the problem for a contest (a contests/<slug>.yaml): it stays out of the problem bank
  // and tracks while that contest is upcoming or running, and can't be opened before it starts.
  contest: z.string().regex(/^[a-z0-9-]+$/).optional(),
  // "default" resolves to the platform default model; a list makes the problem "open model".
  model: z.union([z.string(), z.array(z.string())]).optional(),
  metric: z.enum(metrics).optional(),
  threshold: z.number().min(0).max(1).optional(),
  labels: z.array(z.string()).optional(),
  entrypoint: z.string().optional(),
  compare: z.enum(["allclose", "equal"]).optional(),
  tolerance: z.number().optional(),
  packages: z.array(z.string()).default([]),
  arrayArgs: z.boolean().default(false),
  fixtures: z.record(z.string(), z.string()).default({}),
  // Settings the learner may change (spec: beginner curriculum §4.1). Omitted = fixed by the platform.
  settings: z
    .object({
      temperature: rangeSetting.optional(),
      maxOutputTokens: rangeSetting.optional(),
    })
    .default({}),
  // Each case runs this many times and passes only if every run passes (rewards low temperature).
  repeat: z.number().int().min(1).max(5).default(1),
  // Accepted also requires average output tokens per model call to be at most this.
  tokenBudget: z.number().positive().optional(),
  limits: z
    .object({
      maxOutputTokens: z.number().int().positive().default(256),
      maxCallsPerCase: z.number().int().positive().default(4),
    })
    .default({ maxOutputTokens: 256, maxCallsPerCase: 4 }),
});
export type ProblemConfig = z.infer<typeof problemConfigSchema>;

export const testCaseSchema = z.object({
  id: z.string(),
  // prompt problems use `input`; code problems use positional `args`
  input: z.string().optional(),
  args: z.array(z.unknown()).optional(),
  expected: z.unknown(),
});
export type TestCase = z.infer<typeof testCaseSchema>;

export type Hint = { title: string; body: string };

/** Values the learner chose for a problem's exposed settings. */
export type LearnerSettings = { temperature?: number; maxOutputTokens?: number };

/** Everything about a problem, including hidden tests. Server only. */
export type Problem = {
  slug: string;
  config: ProblemConfig;
  statement: string;
  /** Optional beginner lesson shown before the problem (lesson.md); "" when absent. */
  lesson: string;
  hints: Hint[];
  /** The "## Editorial" section of hints.md; served only through the answer route. */
  editorial: string;
  starter: string;
  fixtures: Record<string, unknown>;
  visibleTests: TestCase[];
  hiddenTests: TestCase[];
};

/** What may be sent to the browser. */
export type PublicProblem = Omit<Problem, "hiddenTests" | "visibleTests" | "editorial"> & {
  visibleTests: TestCase[];
  /** Model ids the learner may pick from; more than one makes it an "open model" problem. */
  models: string[];
  // Only scratch problems ship hidden tests (they run fully in the browser; see spec §6).
  hiddenTests?: TestCase[];
};

export type ProblemSummary = {
  slug: string;
  title: string;
  type: ProblemType;
  difficulty: ProblemConfig["difficulty"];
  tags: string[];
  /** Set for a contest-only problem: the contest it is reserved for. */
  contest?: string;
};
