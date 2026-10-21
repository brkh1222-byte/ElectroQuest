/* Runs learner Python in the browser (spec §6). Classic worker so importScripts works. */
const PYODIDE_VERSION = "0.27.7";
importScripts(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`);

// The `evalquest` SDK learners import. LLM calls go through our proxy with a per-attempt session
// token; synchronous XHR is allowed in workers, so learner code stays plain synchronous Python.
const SDK_MODULE = `
import json, sys, types
from js import XMLHttpRequest

_state = {"token": None, "case": None}
fixtures = {}

def _post(path, payload):
    if not _state["token"]:
        raise RuntimeError("No active session: model calls only work during Run/Submit.")
    xhr = XMLHttpRequest.new()
    xhr.open("POST", path, False)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.setRequestHeader("Authorization", "Bearer " + _state["token"])
    xhr.send(json.dumps(payload))
    data = json.loads(xhr.responseText or "{}")
    if xhr.status >= 400:
        raise RuntimeError(data.get("error", f"HTTP {xhr.status}"))
    return data

class _LLM:
    def chat(self, messages, model=None):
        """Send chat messages; returns the reply text."""
        return _post("/api/llm/chat", {"caseId": _state["case"], "messages": messages, "model": model})["text"]

llm = _LLM()

def embed(texts):
    """Embed a list of strings; returns a list of vectors."""
    return _post("/api/llm/embed", {"texts": list(texts)})["embeddings"]
`;

const RUN_CASE = `
import json, io, contextlib
def _run_case(fn, args_json, array_args=False):
    args = json.loads(args_json)
    if array_args:
        import numpy as np
        args = [np.asarray(a, dtype=float) if isinstance(a, list) else a for a in args]
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        value = fn(*args)
    if hasattr(value, "tolist"):
        value = value.tolist()
    return json.dumps({"value": value, "stdout": buf.getvalue()}, default=str)
`;

// Lesson "python-try" blocks: run a whole snippet, capture print() output, and show the value of a
// final bare expression (like a notebook). Errors are reduced to "Line N: Type: message".
const RUN_SNIPPET = `
import ast, contextlib, io, json, traceback
def _run_snippet(src):
    out = {"stdout": "", "value": None, "error": None}
    try:
        tree = ast.parse(src, "<snippet>", "exec")
    except SyntaxError as e:
        out["error"] = f"Line {e.lineno}: {type(e).__name__}: {e.msg}"
        return json.dumps(out)
    last = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last = ast.Expression(tree.body.pop().value)
    ns = {"__name__": "__main__"}
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(tree, "<snippet>", "exec"), ns)
            if last is not None:
                value = eval(compile(last, "<snippet>", "eval"), ns)
                if value is not None:
                    out["value"] = repr(value)
    except BaseException as e:
        lines = [f.lineno for f in traceback.extract_tb(e.__traceback__) if f.filename == "<snippet>"]
        where = f"Line {lines[-1]}: " if lines else ""
        out["error"] = f"{where}{type(e).__name__}: {e}"
    out["stdout"] = buf.getvalue()
    return json.dumps(out)
`;

let pyodide = null;
let pyodideLoading = null;
const loadedPackages = new Set();

async function init(packages) {
  if (!pyodide) {
    // Memoized: warm-up and the first run can arrive back to back.
    pyodideLoading ??= loadPyodide();
    const instance = await pyodideLoading;
    if (pyodide) return init(packages);
    pyodide = instance;
    pyodide.globals.set("_SDK_SRC", SDK_MODULE);
    pyodide.runPython(`
import sys, types
_sdk = types.ModuleType("evalquest")
exec(_SDK_SRC, _sdk.__dict__)
sys.modules["evalquest"] = _sdk
`);
    pyodide.runPython(RUN_CASE);
    pyodide.runPython(RUN_SNIPPET);
  }
  const missing = packages.filter((p) => !loadedPackages.has(p));
  if (missing.length) {
    await pyodide.loadPackage(missing);
    missing.forEach((p) => loadedPackages.add(p));
  }
}

function formatError(err) {
  const msg = String(err && err.message ? err.message : err);
  // Keep only the learner-relevant tail of Python tracebacks.
  const idx = msg.lastIndexOf('File "<exec>"');
  return idx >= 0 ? msg.slice(idx) : msg;
}

self.onmessage = async ({ data }) => {
  const { id } = data;
  try {
    if (data.type === "init") {
      await init(data.packages || []);
      self.postMessage({ id, type: "ready" });
      return;
    }
    if (data.type === "snippet") {
      // No session token, so evalquest.llm calls fail: lesson snippets never reach the model.
      await init([]);
      pyodide.pyimport("evalquest")._state.set("token", null);
      self.postMessage({ id, type: "snippet-started" });
      const out = JSON.parse(pyodide.globals.get("_run_snippet")(data.code));
      self.postMessage({ id, type: "snippet-done", stdout: out.stdout, value: out.value, error: out.error });
      return;
    }
    if (data.type === "run") {
      await init(data.packages || []);
      const sdk = pyodide.pyimport("evalquest");
      sdk._state.set("token", data.token || null);
      sdk.fixtures.clear();
      sdk.fixtures.update(pyodide.toPy(data.fixtures || {}));

      const ns = pyodide.globals.get("dict")();
      try {
        pyodide.runPython(data.code, { globals: ns });
      } catch (err) {
        self.postMessage({ id, type: "done", compileError: formatError(err) });
        return;
      }
      const fn = ns.get(data.entrypoint);
      if (!fn) {
        self.postMessage({ id, type: "done", compileError: `Function \`${data.entrypoint}\` is not defined.` });
        return;
      }
      const runCase = pyodide.globals.get("_run_case");
      for (const c of data.cases) {
        sdk._state.set("case", c.id);
        try {
          const out = JSON.parse(runCase(fn, JSON.stringify(c.args), !!data.arrayArgs));
          self.postMessage({ id, type: "case", caseId: c.id, value: out.value, stdout: out.stdout });
        } catch (err) {
          self.postMessage({ id, type: "case", caseId: c.id, error: formatError(err) });
        }
      }
      sdk._state.set("token", null);
      self.postMessage({ id, type: "done" });
    }
  } catch (err) {
    self.postMessage({ id, type: "error", error: formatError(err) });
  }
};
