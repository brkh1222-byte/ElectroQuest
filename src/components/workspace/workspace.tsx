"use client";

import type { PublicProblem } from "@/lib/problems/schema";
import { CodeWorkspace } from "./code-workspace";
import { PromptWorkspace } from "./prompt-workspace";

export function Workspace({ problem }: { problem: PublicProblem }) {
  return problem.config.type === "prompt" ? (
    <PromptWorkspace problem={problem} />
  ) : (
    <CodeWorkspace problem={problem} />
  );
}
