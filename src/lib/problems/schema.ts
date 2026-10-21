import { z } from "zod";

export const problemTypes = ["prompt", "pipeline", "scratch"] as const;
export type ProblemType = (typeof problemTypes)[number];

export const metrics = ["label_accuracy", "contains_any"] as const;
export type Metric = (typeof metrics)[number];

// Shape of problems/<slug>/problem.yaml
export const problemConfigSchema = z.object({
  title: z.string(),
  type: z.enum(problemTypes),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([]),
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

/** Everything about a problem, including hidden tests. Server only. */
export type Problem = {
  slug: string;
  config: ProblemConfig;
  statement: string;
  hints: Hint[];
  starter: string;
  fixtures: Record<string, unknown>;
  visibleTests: TestCase[];
  hiddenTests: TestCase[];
};

/** What may be sent to the browser. */
export type PublicProblem = Omit<Problem, "hiddenTests" | "visibleTests"> & {
  visibleTests: TestCase[];
  // Only scratch problems ship hidden tests (they run fully in the browser; see spec §6).
  hiddenTests?: TestCase[];
};

export type ProblemSummary = {
  slug: string;
  title: string;
  type: ProblemType;
  difficulty: ProblemConfig["difficulty"];
  tags: string[];
};
