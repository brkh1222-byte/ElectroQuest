"use client";

import { Loader2, MessageSquare, Play, RotateCcw, Send, SquarePen, Upload } from "lucide-react";
import { useState } from "react";
import type { PublicProblem } from "@/lib/problems/schema";
import { notifySubmitted, useOnLoadDraft, type DraftSettings } from "./events";
import { ResultsPanel } from "./results-panel";
import { hasSettings, SettingsBar } from "./settings-bar";
import type { RunState } from "./types";
import { useDraft } from "./use-draft";
import { Button } from "../ui/button";
import { inputClass } from "../ui/field";
import { tabId, tabPanelId, Tabs } from "../ui/tabs";

const tabs = [
  {
    value: "editor",
    label: (
      <>
        <SquarePen aria-hidden className="size-4" strokeWidth={1.75} />
        System prompt
      </>
    ),
  },
  {
    value: "chat",
    label: (
      <>
        <MessageSquare aria-hidden className="size-4" strokeWidth={1.75} />
        Try it (chat)
      </>
    ),
  },
] as const;

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

function parseSettings(json: string): DraftSettings {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
}

export function PromptWorkspace({ problem }: { problem: PublicProblem }) {
  const [prompt, setPrompt, resetPrompt] = useDraft(`draft:${problem.slug}`, problem.starter);
  const [settingsJson, setSettingsJson, resetSettings] = useDraft(`settings:${problem.slug}`, "{}");
  const settings = parseSettings(settingsJson);
  const setSettings = (next: DraftSettings) => setSettingsJson(JSON.stringify(next));
  const { model, ...generation } = settings;
  const [tab, setTab] = useState<"editor" | "chat">("editor");
  const [state, setState] = useState<RunState>({ status: "idle" });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const busy = state.status === "running";
  useOnLoadDraft((content, loaded) => {
    setPrompt(content);
    if (loaded) setSettings(loaded);
    setTab("editor");
  });

  async function evaluate(mode: "run" | "submit") {
    setState({ status: "running", label: mode === "run" ? "Running examples…" : "Grading hidden tests…" });
    try {
      const report = await postJson(`/api/problems/${problem.slug}/prompt`, { mode, prompt, model, settings: generation });
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
      const reply = await postJson(`/api/problems/${problem.slug}/chat`, { prompt, model, settings: generation, messages: next });
      setMessages([...next, { role: "assistant", content: reply.text }]);
    } catch (err) {
      setChatError((err as Error).message);
    } finally {
      setChatPending(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-2">
        <Tabs id={`prompt-${problem.slug}`} label="Prompt editor" items={tabs} value={tab} onChange={setTab} className="min-w-0 overflow-x-auto" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetPrompt();
            resetSettings();
          }}
          className="ml-auto"
        >
          <RotateCcw aria-hidden className="size-3.5" strokeWidth={2} />
          Reset
        </Button>
      </div>

      <div
        role="tabpanel"
        id={tabPanelId(`prompt-${problem.slug}`)}
        aria-labelledby={tabId(`prompt-${problem.slug}`, tab)}
        className="flex min-h-0 flex-1 flex-col"
      >
      {tab === "editor" ? (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
          aria-label="System prompt"
          className="min-h-64 flex-1 resize-none bg-surface p-4 font-mono text-sm leading-relaxed outline-none focus-visible:outline-none lg:min-h-0"
        />
      ) : (
        <div className="flex min-h-64 flex-1 flex-col bg-surface">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <MessageSquare aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
                Chat with the model using your current system prompt.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] animate-enter rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "ml-auto rounded-br-md bg-accent text-accent-foreground" : "rounded-bl-md bg-surface-2"
                }`}
              >
                {m.content}
              </div>
            ))}
            {chatPending && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" strokeWidth={2} />
                Thinking…
              </p>
            )}
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
              aria-label="Test message"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <Button type="submit" variant="secondary" disabled={chatPending}>
              <Send aria-hidden className="size-4" strokeWidth={2} />
              Send
            </Button>
          </form>
        </div>
      )}
      </div>

      {hasSettings(problem) && <SettingsBar problem={problem} value={settings} onChange={setSettings} />}
      <div className="flex items-center justify-end gap-2 border-y border-border bg-surface px-3 py-2">
        <Button variant="secondary" onClick={() => evaluate("run")} disabled={busy}>
          <Play aria-hidden className="size-3.5" strokeWidth={2} />
          Run
        </Button>
        <Button onClick={() => evaluate("submit")} disabled={busy}>
          <Upload aria-hidden className="size-3.5" strokeWidth={2} />
          Submit
        </Button>
      </div>
      <div className="h-[40%] min-h-48 shrink-0 overflow-y-auto p-4">
        <ResultsPanel state={state} />
      </div>
    </section>
  );
}
