import type { ProblemConfig, ProblemType } from "@/lib/problems/schema";
import { Badge, type BadgeTone } from "./ui/badge";

const difficultyTone: Record<ProblemConfig["difficulty"], BadgeTone> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: ProblemConfig["difficulty"] }) {
  return (
    <Badge tone={difficultyTone[difficulty]} dot className="capitalize">
      {difficulty}
    </Badge>
  );
}

export const typeLabel: Record<ProblemType, string> = {
  prompt: "Prompt",
  pipeline: "Pipeline",
  scratch: "From scratch",
};

export function TypeBadge({ type }: { type: ProblemType }) {
  return <Badge>{typeLabel[type]}</Badge>;
}
