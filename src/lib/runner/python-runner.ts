"use client";

export type RunCase = { id: string; args: unknown[] };
export type CaseOutput = { caseId: string; value?: unknown; error?: string; stdout?: string };

type RunOptions = {
  code: string;
  entrypoint: string;
  cases: RunCase[];
  packages?: string[];
  fixtures?: Record<string, unknown>;
  token?: string;
  arrayArgs?: boolean;
  timeoutMs?: number;
  onCase?: (out: CaseOutput) => void;
};

/** Result of a lesson snippet: printed output, the repr of a final bare expression, or an error. */
export type SnippetResult = { stdout: string; value: string | null; error: string | null };

export type RunResult =
  | { ok: true; outputs: Record<string, CaseOutput> }
  | { ok: false; error: string };

/**
 * Wraps the Pyodide worker. A runaway learner loop can't be interrupted from inside,
 * so on timeout we terminate the worker and start a fresh one.
 */
class PythonRunner {
  private worker: Worker | null = null;
  private nextId = 0;

  private getWorker() {
    this.worker ??= new Worker("/pyodide-worker.js");
    return this.worker;
  }

  private reset() {
    this.worker?.terminate();
    this.worker = null;
  }

  /** Starts downloading Pyodide early (it's ~10MB; cached by the browser afterwards). */
  warmUp(packages: string[] = []) {
    this.getWorker().postMessage({ id: -1, type: "init", packages });
  }

  run(opts: RunOptions): Promise<RunResult> {
    const worker = this.getWorker();
    const id = this.nextId++;
    const outputs: Record<string, CaseOutput> = {};

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        this.reset();
        resolve({ ok: false, error: `Time limit exceeded (${(opts.timeoutMs ?? 60_000) / 1000}s).` });
      }, opts.timeoutMs ?? 60_000);

      const onMessage = ({ data }: MessageEvent) => {
        if (data.id !== id) return;
        if (data.type === "case") {
          const out: CaseOutput = { caseId: data.caseId, value: data.value, error: data.error, stdout: data.stdout };
          outputs[data.caseId] = out;
          opts.onCase?.(out);
        } else if (data.type === "done") {
          cleanup();
          resolve(data.compileError ? { ok: false, error: data.compileError } : { ok: true, outputs });
        } else if (data.type === "error") {
          cleanup();
          resolve({ ok: false, error: data.error });
        }
      };
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
      };

      worker.addEventListener("message", onMessage);
      worker.postMessage({
        id,
        type: "run",
        code: opts.code,
        entrypoint: opts.entrypoint,
        cases: opts.cases,
        packages: opts.packages ?? [],
        fixtures: opts.fixtures ?? {},
        token: opts.token,
        arrayArgs: opts.arrayArgs ?? false,
      });
    });
  }

  /**
   * Runs a whole snippet with no entrypoint and no model access (lesson "python-try" blocks).
   * The time limit starts once Python is loaded, so the first ~10MB download doesn't count.
   */
  runSnippet(code: string, timeoutMs = 10_000): Promise<SnippetResult> {
    const worker = this.getWorker();
    const id = this.nextId++;
    return new Promise((resolve) => {
      const fail = (error: string) => {
        cleanup();
        this.reset();
        resolve({ stdout: "", value: null, error });
      };
      let timer = setTimeout(() => fail("Python took too long to load. Check your connection and try again."), 120_000);
      const onMessage = ({ data }: MessageEvent) => {
        if (data.id !== id) return;
        if (data.type === "snippet-started") {
          clearTimeout(timer);
          timer = setTimeout(() => fail(`Time limit exceeded (${timeoutMs / 1000}s). Does a loop run forever?`), timeoutMs);
        } else if (data.type === "snippet-done") {
          cleanup();
          resolve({ stdout: data.stdout ?? "", value: data.value ?? null, error: data.error ?? null });
        } else if (data.type === "error") {
          cleanup();
          resolve({ stdout: "", value: null, error: data.error });
        }
      };
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
      };
      worker.addEventListener("message", onMessage);
      worker.postMessage({ id, type: "snippet", code });
    });
  }
}

let runner: PythonRunner | null = null;
export function getRunner() {
  runner ??= new PythonRunner();
  return runner;
}

/** NumPy-style allclose for nested number arrays (scratch problem grading in the browser). */
export function allclose(actual: unknown, expected: unknown, tol: number): boolean {
  if (typeof expected === "number") {
    return typeof actual === "number" && Math.abs(actual - expected) <= tol + tol * Math.abs(expected);
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((e, i) => allclose(actual[i], e, tol))
    );
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}
