"use client";

import { SignInButton } from "@clerk/nextjs";
import { Eye, Loader2, SquareArrowOutUpRight, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import type { PublicProblem } from "@/lib/problems/schema";
import { loadDraft, type DraftSettings } from "./events";
import { Button } from "../ui/button";

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
      <Button variant="ghost" size="sm" onClick={() => setState({ status: "confirm" })} className="-ml-3">
        <Eye aria-hidden className="size-4" strokeWidth={1.75} />
        Show answer
      </Button>
    );
  }

  if (state.status === "confirm" || state.status === "loading") {
    return (
      <div className="animate-enter space-y-3 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <TriangleAlert aria-hidden className="size-4 text-warning" strokeWidth={2} />
          Try a few more times first?
        </p>
        <p className="text-muted">
          Getting stuck is how you learn. If you see the answer, solving this problem still counts, but it is marked
          &ldquo;solved with help&rdquo; and you leave its leaderboard.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={reveal} disabled={state.status === "loading"}>
            {state.status === "loading" && <Loader2 aria-hidden className="size-3.5 motion-safe:animate-spin" strokeWidth={2} />}
            {state.status === "loading" ? "Loading…" : "Show me the answer"}
          </Button>
          <Button size="sm" onClick={() => setState({ status: "closed" })}>
            Keep trying
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return state.signIn ? (
      <p className="text-sm text-muted">
        <SignInButton mode="modal">
          <button className="font-medium text-accent underline underline-offset-2">Sign in</button>
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
    <div className="animate-enter space-y-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-medium">Answer</p>
      {answer.editorial && <Markdown>{answer.editorial}</Markdown>}
      <pre className="max-h-80 overflow-auto overscroll-contain rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
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
      <Button variant="secondary" size="sm" onClick={() => loadDraft(answer.reference, answer.settings)}>
        <SquareArrowOutUpRight aria-hidden className="size-3.5" strokeWidth={2} />
        Load into editor
      </Button>
      {isPrompt && <p className="text-xs text-muted">Read it, then try writing your own version in your own words.</p>}
    </div>
  );
}
