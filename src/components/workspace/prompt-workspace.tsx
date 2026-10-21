"use client";

import { useState } from "react";
import type { PublicProblem } from "@/lib/problems/schema";
import { notifySubmitted, useOnLoadDraft } from "./events";
import { ResultsPanel } from "./results-panel";
import type { RunState } from "./types";
import { useDraft } from "./use-draft";

type ChatMessage = { role: "user" | "assistant"; content: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export function PromptWorkspace({ problem }: { problem: PublicProblem }) {
  const [prompt, setPrompt, resetPrompt] = useDraft(`draft:${problem.slug}`, problem.starter);
  const [tab, setTab] = useState<"editor" | "chat">("editor");
  const [state, setState] = useState<RunState>({ status: "idle" });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const busy = state.status === "running";
  useOnLoadDraft((content) => {
    setPrompt(content);
    setTab("editor");
  });

  async function evaluate(mode: "run" | "submit") {
    setState({ status: "running", label: mode === "run" ? "Running examples…" : "Grading hidden tests…" });
    try {
      const report = await postJson(`/api/problems/${problem.slug}/prompt`, { mode, prompt });
      setState({ status: "done", report });
      if (mode === "submit") notifySubmitted();
    } catch (err) {
      setState({ status: "error", error: (err as Error).message });
    }
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setChatInput("");
    setChatPending(true);
    setChatError(null);
    try {
      const reply = await postJson(`/api/problems/${problem.slug}/chat`, { prompt, messages: next });
      setMessages([...next, { role: "assistant", content: reply.text }]);
    } catch (err) {
      setChatError((err as Error).message);
    } finally {
      setChatPending(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-border px-3">
        {(["editor", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm ${
              tab === t ? "border-accent font-medium" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t === "editor" ? "System prompt" : "Try it (chat)"}
          </button>
        ))}
        <button onClick={resetPrompt} className="ml-auto text-xs text-muted hover:text-foreground">
          Reset
        </button>
      </div>

      {tab === "editor" ? (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
          aria-label="System prompt"
          className="min-h-64 flex-1 resize-none lg:min-h-0 bg-surface p-4 font-mono text-sm outline-none"
        />
      ) : (
        <div className="flex min-h-64 flex-1 flex-col bg-surface">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted">Chat with the model using your current system prompt.</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "ml-auto bg-accent text-accent-foreground" : "border border-border"
                }`}
              >
                {m.content}
              </div>
            ))}
            {chatPending && <p className="text-sm text-muted">Thinking…</p>}
            {chatError && <p className="text-sm text-danger">{chatError}</p>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a test ticket…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              disabled={chatPending}
              className="rounded-lg border border-border px-3 text-sm hover:bg-background disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

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
