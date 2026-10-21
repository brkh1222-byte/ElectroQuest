import type { ProblemConfig, ProblemType } from "@/lib/problems/schema";

const difficultyClass: Record<ProblemConfig["difficulty"], string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: ProblemConfig["difficulty"] }) {
  return <span className={`text-sm font-medium capitalize ${difficultyClass[difficulty]}`}>{difficulty}</span>;
}

export const typeLabel: Record<ProblemType, string> = {
  prompt: "Prompt",
  pipeline: "Pipeline",
  scratch: "From scratch",
};

export function TypeBadge({ type }: { type: ProblemType }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{typeLabel[type]}</span>
  );
}
