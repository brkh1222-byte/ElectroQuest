"use client";

import { SignInButton } from "@clerk/nextjs";
import { ChevronDown, SquareArrowOutUpRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { buttonClass } from "../ui/button";
import type { PublicProblem } from "@/lib/problems/schema";
import { loadDraft, useOnSubmitted, type DraftSettings } from "./events";
import { useJson } from "./use-json";

type Submission = {
  id: string;
  content: string;
  settings: DraftSettings | null;
  score: number;
  tokens: number;
  accepted: boolean;
  createdAt: string;
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function SubmissionsTab({ problem }: { problem: PublicProblem }) {
  const [state, reload] = useJson<{ submissions: Submission[] }>(`/api/problems/${problem.slug}/submissions`);
  const [open, setOpen] = useState<string | null>(null);
  useOnSubmitted(reload);
  const showTokens = problem.config.type !== "scratch";

  if (state.status === "loading") return <p className="text-sm text-muted">Loading submissions…</p>;
  if (state.status === "error") {
    if (state.httpStatus !== 401) return <p className="text-sm text-danger">{state.error}</p>;
    return (
      <div className="space-y-3 text-sm text-muted">
        <p>Sign in to keep a history of your submissions.</p>
        <SignInButton mode="modal">
          <button className={buttonClass({ variant: "secondary", size: "sm" })}>
            Sign in
          </button>
        </SignInButton>
      </div>
    );
  }

  const { submissions } = state.data;
  if (submissions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        No submissions yet. Press Submit to grade your solution on the hidden tests.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {submissions.map((s) => (
        <li key={s.id}>
          <button
            onClick={() => setOpen(open === s.id ? null : s.id)}
            aria-expanded={open === s.id}
            className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-offset-[-2px]"
          >
            <Badge tone={s.accepted ? "success" : "danger"} className="w-28 justify-center">
              {s.accepted ? "Accepted" : "Not accepted"}
            </Badge>
            <span className="w-12 tabular-nums">{Math.round(s.score * 100)}%</span>
            {showTokens && (
              <span className="w-24 text-muted tabular-nums">{s.tokens.toLocaleString()} tokens</span>
            )}
            <span className="ml-auto flex items-center gap-2 text-xs text-muted">
              {dateFormat.format(new Date(s.createdAt))}
              <ChevronDown
                aria-hidden
                className={`size-4 transition-transform duration-150 ease-out ${open === s.id ? "rotate-180" : ""}`}
                strokeWidth={1.75}
              />
            </span>
          </button>
          {open === s.id && (
            <div className="space-y-2 border-t border-border px-4 py-3">
              <pre className="max-h-80 overflow-auto overscroll-contain rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {s.content}
              </pre>
              <button onClick={() => loadDraft(s.content, s.settings)} className={buttonClass({ variant: "secondary", size: "sm" })}>
                <SquareArrowOutUpRight aria-hidden className="size-3.5" strokeWidth={2} />
                Load into editor
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
