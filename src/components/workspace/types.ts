export type CaseView = {
  id: string;
  passed: boolean;
  input?: unknown;
  expected?: unknown;
  actual?: unknown;
  error?: string;
  stdout?: string;
};

export type RunReport = {
  mode: "run" | "submit";
  passed: number;
  total: number;
  score: number;
  accepted?: boolean;
  tokens?: number;
  cases: CaseView[];
};

export type RunState =
  | { status: "idle" }
  | { status: "running"; label: string }
  | { status: "error"; error: string }
  | { status: "done"; report: RunReport };
