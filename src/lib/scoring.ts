import type { Metric, TestCase } from "./problems/schema";

export type CaseResult = {
  id: string;
  passed: boolean;
  actual: unknown;
  error?: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s"'`.:;,!?-]+|[\s"'`.:;,!?-]+$/g, "");
}

/** True if `phrase` occurs in `text` on word boundaries (case-insensitive). */
function containsPhrase(text: string, phrase: string) {
  const escaped = normalize(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(normalize(text));
}

export function scoreCase(metric: Metric, test: TestCase, actual: unknown): boolean {
  if (typeof actual !== "string") return false;
  switch (metric) {
    case "label_accuracy":
      return normalize(actual) === normalize(String(test.expected));
    case "final_answer": {
      // Lets the model reason first: only the last non-empty line must equal the answer.
      const lines = actual.split("\n").filter((l) => l.trim());
      const last = (lines.at(-1) ?? "").replace(/\*/g, "");
      return normalize(last) === normalize(String(test.expected));
    }
    case "contains_any": {
      const options = Array.isArray(test.expected) ? test.expected : [test.expected];
      return options.some((o) => containsPhrase(actual, String(o)));
    }
  }
}

export function aggregate(results: CaseResult[]) {
  const passed = results.filter((r) => r.passed).length;
  return { passed, total: results.length, score: results.length ? passed / results.length : 0 };
}
