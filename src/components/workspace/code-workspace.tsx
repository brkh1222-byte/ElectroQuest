"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import type { PublicProblem, TestCase } from "@/lib/problems/schema";
import { allclose, getRunner, type CaseOutput } from "@/lib/runner/python-runner";
import { notifySubmitted, useOnLoadDraft } from "./events";
import { ResultsPanel } from "./results-panel";
import type { CaseView, RunState } from "./types";
import { useDraft } from "./use-draft";

function toRunCases(tests: TestCase[]) {
  return tests.map((t) => ({ id: t.id, args: t.args ?? [] }));
}

async function postJson(url: string, body: unknown, token?: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the media query on mount
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

export function CodeWorkspace({ problem }: { problem: PublicProblem }) {
  const { config } = problem;
  const [code, setCode, resetCode] = useDraft(`draft:${problem.slug}`, problem.starter);
  const [state, setState] = useState<RunState>({ status: "idle" });
  const dark = useDarkMode();
  const busy = state.status === "running";
  useOnLoadDraft(setCode);

  useEffect(() => {
    getRunner().warmUp(config.packages);
  }, [config.packages]);

  /** Scratch problems: everything runs and is graded in the browser (spec §3.3). */
  async function runScratch(mode: "run" | "submit") {
    const tests = mode === "run" ? problem.visibleTests : [...problem.visibleTests, ...(problem.hiddenTests ?? [])];
    setState({ status: "running", label: "Running in your browser…" });
    const result = await getRunner().run({
      code,
      entrypoint: config.entrypoint ?? "solve",
      cases: toRunCases(tests),
      packages: config.packages,
      arrayArgs: config.arrayArgs,
    });
    if (!result.ok) return setState({ status: "error", error: result.error });

    const isHidden = (id: string) => mode === "submit" && !problem.visibleTests.some((t) => t.id === id);
    const cases: CaseView[] = tests.map((t) => {
      const out = result.outputs[t.id];
      const passed =
        !!out &&
        !out.error &&
        (config.compare === "allclose"
          ? allclose(out.value, t.expected, config.tolerance ?? 1e-6)
          : JSON.stringify(out.value) === JSON.stringify(t.expected));
      return isHidden(t.id)
        ? { id: t.id, passed, error: out?.error }
        : { id: t.id, passed, input: t.args, expected: t.expected, actual: out?.value, error: out?.error, stdout: out?.stdout };
    });
    const passed = cases.filter((c) => c.passed).length;
    if (mode === "submit") {
      // Saves history for signed-in learners; anonymous visitors get a 401, which is fine to ignore.
      postJson(`/api/problems/${problem.slug}/submissions`, { code, passed, total: cases.length })
        .then(notifySubmitted)
        .catch(() => {});
    }
    setState({
      status: "done",
      report: {
        mode,
        passed,
        total: cases.length,
        score: cases.length ? passed / cases.length : 0,
        accepted: mode === "submit" ? passed === cases.length : undefined,
        cases,
      },
    });
  }

  /** Pipeline problems: code runs in the browser, LLM calls + scoring go through the server (spec §6). */
  async function runPipeline(mode: "run" | "submit") {
    try {
      setState({ status: "running", label: "Starting session…" });
      const session = await postJson(`/api/problems/${problem.slug}/session`, { mode });
      let done = 0;
      setState({ status: "running", label: `Running 0/${session.cases.length} cases…` });

      const result = await getRunner().run({
        code,
        entrypoint: config.entrypoint ?? "solve",
        cases: session.cases,
        packages: config.packages,
        fixtures: problem.fixtures,
        arrayArgs: config.arrayArgs,
        token: session.token,
        timeoutMs: 120_000,
        onCase: () => setState({ status: "running", label: `Running ${++done}/${session.cases.length} cases…` }),
      });
      if (!result.ok) return setState({ status: "error", error: result.error });

      setState({ status: "running", label: "Scoring…" });
      const outputs = Object.fromEntries(
        Object.values(result.outputs).map((o: CaseOutput) => [o.caseId, { value: o.value, error: o.error }]),
      );
      const report = await postJson(`/api/problems/${problem.slug}/score`, { code, outputs }, session.token);
      // Attach local stdout to visible cases for debugging.
      report.cases = report.cases.map((c: CaseView) => ({ ...c, stdout: result.outputs[c.id]?.stdout }));
      setState({ status: "done", report });
      if (mode === "submit") notifySubmitted();
    } catch (err) {
      setState({ status: "error", error: (err as Error).message });
    }
  }

  const evaluate = config.type === "scratch" ? runScratch : runPipeline;

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex items-center border-b border-border px-4 py-2 text-sm">
        <span className="font-medium">Python</span>
        <span className="ml-2 text-xs text-muted">runs in your browser</span>
        <button onClick={resetCode} className="ml-auto text-xs text-muted hover:text-foreground">
          Reset
        </button>
      </div>
      <div className="min-h-72 flex-1 lg:min-h-0">
        <Editor
          language="python"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          theme={dark ? "vs-dark" : "light"}
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, tabSize: 4 }}
        />
      </div>
      <div className="flex items-center justify-end gap-2 border-y border-border px-3 py-2">
        <button
          onClick={() => evaluate("run")}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-surface disabled:opacity-50"
        >
          Run
        </button>
        <button
          onClick={() => evaluate("submit")}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Submit
        </button>
      </div>
      <div className="h-[40%] min-h-48 shrink-0 overflow-y-auto p-4">
        <ResultsPanel state={state} />
      </div>
    </section>
  );
}
