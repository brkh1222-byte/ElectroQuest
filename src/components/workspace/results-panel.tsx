"use client";

import Link from "next/link";
import type { CaseView, RunState } from "./types";

function show(value: unknown) {
  if (value === undefined || value === null) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function CaseRow({ c }: { c: CaseView }) {
  return (
    <details className="rounded-lg border border-border bg-surface" open={!c.passed && c.input !== undefined}>
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
        <span className={c.passed ? "text-success" : "text-danger"}>{c.passed ? "✓" : "✗"}</span>
        <span className="font-mono text-xs text-muted">{c.id}</span>
      </summary>
      <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 border-t border-border px-3 py-2 font-mono text-xs">
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
    return <p className="text-sm text-muted">Run checks the visible examples. Submit grades the hidden tests.</p>;
  }
  if (state.status === "running") return <p className="text-sm text-muted">{state.label}</p>;
  if (state.status === "error") {
    return <pre className="text-sm whitespace-pre-wrap text-danger">{state.error}</pre>;
  }

  const { report } = state;
  const verdict =
    report.mode === "submit"
      ? report.accepted
        ? { text: "Accepted", className: "text-success" }
        : { text: report.overBudget ? "Over token budget" : "Not accepted", className: "text-danger" }
      : { text: "Run finished", className: "text-foreground" };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className={`text-lg font-semibold ${verdict.className}`}>{verdict.text}</span>
        <span className="text-sm text-muted">
          {report.passed}/{report.total} passed · {Math.round(report.score * 100)}%
        </span>
        {report.tokens !== undefined && report.tokens > 0 && (
          <span className="text-sm text-muted">{report.tokens.toLocaleString()} tokens</span>
        )}
        {report.tokenBudget !== undefined && (
          <span className={`text-sm ${report.overBudget ? "text-danger" : "text-muted"}`}>
            avg {report.avgOutputTokens} / {report.tokenBudget} output tokens per reply
          </span>
        )}
      </div>
      {report.contest && (
        <p className="text-sm text-success">
          Counted for{" "}
          <Link href={`/contests/${report.contest.slug}`} className="font-medium underline underline-offset-2">
            {report.contest.title}
          </Link>
          .
        </p>
      )}
      <div className="space-y-2">
        {report.cases.map((c) => (
          <CaseRow key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
