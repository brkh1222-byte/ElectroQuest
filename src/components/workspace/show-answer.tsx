"use client";

import { SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import type { PublicProblem } from "@/lib/problems/schema";
import { loadDraft, type DraftSettings } from "./events";

type Answer = { editorial: string; reference: string; settings: DraftSettings | null };

/** The answer, behind a warning: revealing it takes the learner off this problem's leaderboard. */
export function ShowAnswer({ problem }: { problem: PublicProblem }) {
  const [state, setState] = useState<
    | { status: "closed" }
    | { status: "confirm" }
    | { status: "loading" }
    | { status: "shown"; answer: Answer }
    | { status: "error"; error: string; signIn: boolean }
  >({ status: "closed" });

  async function reveal() {
    setState({ status: "loading" });
    const res = await fetch(`/api/problems/${problem.slug}/answer`, { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) setState({ status: "shown", answer: data });
    else setState({ status: "error", error: data?.error ?? "Something went wrong.", signIn: res?.status === 401 });
  }

  if (state.status === "closed") {
    return (
      <button onClick={() => setState({ status: "confirm" })} className="text-sm text-muted underline underline-offset-2 hover:text-foreground">
        Show answer
      </button>
    );
  }

  if (state.status === "confirm" || state.status === "loading") {
    return (
      <div className="space-y-3 rounded-lg border border-warning/50 bg-surface p-4 text-sm">
        <p className="font-medium">Try a few more times first?</p>
        <p className="text-muted">
          Getting stuck is how you learn. If you see the answer, solving this problem still counts, but it is marked
          &ldquo;solved with help&rdquo; and you leave its leaderboard.
        </p>
        <div className="flex gap-2">
          <button
            onClick={reveal}
            disabled={state.status === "loading"}
            className="rounded-lg border border-border px-3 py-1.5 hover:bg-background disabled:opacity-50"
          >
            {state.status === "loading" ? "Loading…" : "Show me the answer"}
          </button>
          <button onClick={() => setState({ status: "closed" })} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-foreground hover:opacity-90">
            Keep trying
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return state.signIn ? (
      <p className="text-sm text-muted">
        <SignInButton mode="modal">
          <button className="text-accent underline underline-offset-2">Sign in</button>
        </SignInButton>{" "}
        to see the answer.
      </p>
    ) : (
      <p className="text-sm text-danger">{state.error}</p>
    );
  }

  const { answer } = state;
  const isPrompt = problem.config.type === "prompt";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-medium">Answer</p>
      {answer.editorial && <Markdown>{answer.editorial}</Markdown>}
      <pre className="max-h-80 overflow-auto rounded-md bg-background p-3 font-mono text-xs whitespace-pre-wrap">
        {answer.reference}
      </pre>
      {answer.settings && (
        <p className="text-xs text-muted">
          Settings:{" "}
          {Object.entries(answer.settings)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ")}
        </p>
      )}
      <button
        onClick={() => loadDraft(answer.reference, answer.settings)}
        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-background"
      >
        Load into editor
      </button>
      {isPrompt && <p className="text-xs text-muted">Read it, then try writing your own version in your own words.</p>}
    </div>
  );
}
