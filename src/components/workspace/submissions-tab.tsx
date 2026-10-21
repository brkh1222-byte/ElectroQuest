"use client";

import { SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import type { PublicProblem } from "@/lib/problems/schema";
import { loadDraft, useOnSubmitted } from "./events";
import { useJson } from "./use-json";

type Submission = {
  id: string;
  content: string;
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
          <button className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-surface">
            Sign in
          </button>
        </SignInButton>
      </div>
    );
  }

  const { submissions } = state.data;
  if (submissions.length === 0) {
    return <p className="text-sm text-muted">No submissions yet. Press Submit to grade your solution on the hidden tests.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {submissions.map((s) => (
        <li key={s.id}>
          <button
            onClick={() => setOpen(open === s.id ? null : s.id)}
            aria-expanded={open === s.id}
            className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-left text-sm hover:bg-background"
          >
            <span className={`w-28 font-medium ${s.accepted ? "text-success" : "text-danger"}`}>
              {s.accepted ? "Accepted" : "Not accepted"}
            </span>
            <span className="w-12 tabular-nums">{Math.round(s.score * 100)}%</span>
            {showTokens && (
              <span className="w-24 text-muted tabular-nums">{s.tokens.toLocaleString()} tokens</span>
            )}
            <span className="ml-auto text-xs text-muted">{dateFormat.format(new Date(s.createdAt))}</span>
          </button>
          {open === s.id && (
            <div className="space-y-2 border-t border-border px-4 py-3">
              <pre className="max-h-80 overflow-auto rounded-md bg-background p-3 font-mono text-xs whitespace-pre-wrap">
                {s.content}
              </pre>
              <button
                onClick={() => loadDraft(s.content)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-background"
              >
                Load into editor
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
