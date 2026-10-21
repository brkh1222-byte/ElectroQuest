export type CaseView = {
  id: string;
  passed: boolean;
  input?: unknown;
  expected?: unknown;
  actual?: unknown;
  error?: string;
  stdout?: string;
  /** Every reply when the problem runs each case several times. */
  replies?: string[];
};

export type RunReport = {
  mode: "run" | "submit";
  passed: number;
  total: number;
  score: number;
  accepted?: boolean;
  tokens?: number;
  avgOutputTokens?: number;
  tokenBudget?: number;
  overBudget?: boolean;
  /** Set when an Accepted submit counted for a running contest the learner joined. */
  contest?: { slug: string; title: string } | null;
  cases: CaseView[];
};

export type RunState =
  | { status: "idle" }
  | { status: "running"; label: string }
  | { status: "error"; error: string }
  | { status: "done"; report: RunReport };
