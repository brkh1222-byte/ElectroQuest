"use client";

import { CircleCheck, CircleX, Info, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import type { CaseView, RunState } from "./types";

function show(value: unknown) {
  if (value === undefined || value === null) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function CaseRow({ c }: { c: CaseView }) {
  return (
    <details className="group rounded-xl border border-border bg-surface" open={!c.passed && c.input !== undefined}>
      <summary className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface-2">
        {c.passed ? (
          <CircleCheck aria-label="Passed" className="size-4 shrink-0 text-success" strokeWidth={2} />
        ) : (
          <CircleX aria-label="Failed" className="size-4 shrink-0 text-danger" strokeWidth={2} />
        )}
        <span className="min-w-0 truncate font-mono text-xs text-muted">{c.id}</span>
      </summary>
      <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-border px-3 py-2.5 font-mono text-xs">
        {c.input !== undefined && (
          <>
            <dt className="text-muted">Input</dt>
            <dd className="break-words whitespace-pre-wrap">{show(c.input)}</dd>
            <dt className="text-muted">Expected</dt>
            <dd className="break-words whitespace-pre-wrap">{show(c.expected)}</dd>
          </>
        )}
        {c.replies ? (
          c.replies.map((r, i) => (
            <div key={i} className="contents">
              <dt className="text-muted">Run {i + 1}</dt>
              <dd className="break-words whitespace-pre-wrap">{r}</dd>
            </div>
          ))
        ) : (
          c.actual !== undefined && (
            <>
              <dt className="text-muted">Output</dt>
              <dd className="break-words whitespace-pre-wrap">{show(c.actual)}</dd>
            </>
          )
        )}
        {c.error && (
          <>
            <dt className="text-danger">Error</dt>
            <dd className="break-words whitespace-pre-wrap text-danger">{c.error}</dd>
          </>
        )}
        {c.stdout && (
          <>
            <dt className="text-muted">Stdout</dt>
            <dd className="break-words whitespace-pre-wrap">{c.stdout}</dd>
          </>
        )}
        {c.input === undefined && !c.error && <dd className="col-span-2 text-muted">Hidden test case</dd>}
      </dl>
    </details>
  );
}

export function ResultsPanel({ state }: { state: RunState }) {
  if (state.status === "idle") {
    return (
      <p className="flex items-start gap-2 text-sm text-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <span>
          <strong className="font-medium text-foreground">Run</strong> checks the visible examples.{" "}
          <strong className="font-medium text-foreground">Submit</strong> grades the hidden tests.
        </span>
      </p>
    );
  }
  if (state.status === "running") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted">
        <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" strokeWidth={2} />
        {state.label}
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex animate-enter gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-danger">
        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
        <pre className="min-w-0 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">{state.error}</pre>
      </div>
    );
  }

  const { report } = state;
  const verdict =
    report.mode === "submit"
      ? report.accepted
        ? { text: "Accepted", className: "text-success", Icon: CircleCheck }
        : { text: report.overBudget ? "Over token budget" : "Not accepted", className: "text-danger", Icon: CircleX }
      : { text: "Run finished", className: "text-foreground", Icon: null };

  return (
    <div className="stagger space-y-3">
      <div className="flex animate-enter flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`flex items-center gap-1.5 text-lg font-semibold ${verdict.className}`}>
          {verdict.Icon && <verdict.Icon aria-hidden className="size-5" strokeWidth={2.25} />}
          {verdict.text}
        </span>
        <Badge tone={report.passed === report.total ? "success" : "neutral"} className="tabular-nums">
          {report.passed}/{report.total} passed · {Math.round(report.score * 100)}%
        </Badge>
        {report.tokens !== undefined && report.tokens > 0 && (
          <Badge className="tabular-nums">{report.tokens.toLocaleString()} tokens</Badge>
        )}
        {report.tokenBudget !== undefined && (
          <Badge tone={report.overBudget ? "danger" : "neutral"} className="tabular-nums">
            avg {report.avgOutputTokens} / {report.tokenBudget} output tokens per reply
          </Badge>
        )}
      </div>
      {report.contest && (
        <p className="animate-enter text-sm text-success">
          Counted for{" "}
          <Link href={`/contests/${report.contest.slug}`} className="font-medium underline underline-offset-2">
            {report.contest.title}
          </Link>
          .
        </p>
      )}
      <div className="animate-enter space-y-2">
        {report.cases.map((c) => (
          <CaseRow key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
