"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { getRunner, type SnippetResult } from "@/lib/runner/python-runner";

/** Short, beginner-friendly advice for the errors new coders hit most often. */
function errorTip(error: string) {
  if (/IndentationError|TabError/.test(error)) return "Check the spaces at the start of each line. Lines inside a function or loop need 4 spaces.";
  if (/unterminated string|EOL while scanning/.test(error)) return "A piece of text is missing its closing quote mark.";
  if (/NameError/.test(error)) return "Python does not know this name. Check the spelling, or put text in quotes.";
  if (/SyntaxError: expected ':'/.test(error)) return "Lines that start with def, for or if must end with a colon (:).";
  if (/TypeError: can only concatenate str/.test(error)) return "You can't add text and a number. Use str(number) or an f-string.";
  if (/KeyError/.test(error)) return "That key is not in the dictionary. Check the spelling and the quotes.";
  if (/IndexError/.test(error)) return "The list is shorter than you think. Positions start at 0.";
  return null;
}

// Pyodide downloads once per page load (about 10MB), so only the first Run says "Loading".
let pythonLoaded = false;

/**
 * An editable Python box inside a lesson (```python-try). Code runs in the browser with the shared
 * Pyodide worker: no model calls, no sign-in and no quota. Shows print() output, the value of a
 * final bare expression, and errors.
 */
export function PythonTry({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SnippetResult | null>(null);
  const warmed = useRef(false);
  const escaped = useRef(false);

  function warmUp() {
    if (warmed.current) return;
    warmed.current = true;
    getRunner().warmUp();
  }

  async function run() {
    warmUp();
    setRunning(true);
    const out = await getRunner().runSnippet(code);
    pythonLoaded = true;
    setResult(out);
    setRunning(false);
  }

  function reset() {
    setCode(initial);
    setResult(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!running) run();
      return;
    }
    if (e.key === "Escape") {
      // Next Tab leaves the box, so keyboard users are never trapped.
      escaped.current = true;
      return;
    }
    if (e.key === "Tab" && !e.shiftKey && !escaped.current) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: start, selectionEnd: end } = el;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => el.setSelectionRange(start + 4, start + 4));
    }
    escaped.current = false;
  }

  const rows = Math.min(Math.max(code.split("\n").length, 3), 18);
  const tip = result?.error ? errorTip(result.error) : null;
  const empty = result && !result.error && !result.stdout && result.value === null;

  return (
    <div className="not-prose my-5 space-y-3 rounded-xl border border-accent/40 bg-surface p-4" onPointerEnter={warmUp}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">Try it in Python</p>
        <p className="text-xs text-muted">Runs in your browser. Free.</p>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={warmUp}
        rows={rows}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Python code"
        className="w-full resize-y rounded-md border border-border bg-background p-2.5 font-mono text-xs leading-relaxed outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={running || !code.trim()}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {running ? (pythonLoaded ? "Running…" : "Loading Python…") : "Run"}
        </button>
        <button onClick={reset} className="text-xs text-muted hover:text-foreground">
          Reset
        </button>
        <span className="ml-auto hidden text-xs text-muted sm:inline">Ctrl + Enter to run</span>
      </div>
      {result && (
        <div aria-live="polite" className="space-y-2 rounded-md border border-border bg-background p-3 font-mono text-xs">
          {result.stdout && (
            <div>
              <span className="mb-1 block font-sans text-muted">Output</span>
              <pre className="whitespace-pre-wrap">{result.stdout.replace(/\n$/, "")}</pre>
            </div>
          )}
          {result.value !== null && (
            <div>
              <span className="mb-1 block font-sans text-muted">Value of the last line</span>
              <pre className="whitespace-pre-wrap">{result.value}</pre>
            </div>
          )}
          {result.error && (
            <div>
              <span className="mb-1 block font-sans text-danger">Error</span>
              <pre className="whitespace-pre-wrap text-danger">{result.error}</pre>
              {tip && <p className="mt-1.5 font-sans text-sm text-muted">{tip}</p>}
            </div>
          )}
          {empty && <p className="font-sans text-muted">The code ran, but printed nothing. Use print() to show a value.</p>}
        </div>
      )}
    </div>
  );
}
