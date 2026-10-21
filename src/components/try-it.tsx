"use client";

import { SignInButton } from "@clerk/nextjs";
import { useState } from "react";

export type TryItOptions = { temperature?: number; maxOutputTokens?: number; repeat?: number };

/**
 * A small playground inside a lesson: edit a system prompt and a message, see the model's reply.
 * Uses the problem's scratch chat endpoint, so each send counts as one Run. With `repeat`, the
 * same message is sent several times to show how much replies vary.
 */
export function TryIt({ slug, system, user, options = {} }: { slug: string; system: string; user: string; options?: TryItOptions }) {
  const [prompt, setPrompt] = useState(system);
  const [message, setMessage] = useState(user);
  const [temperature, setTemperature] = useState(options.temperature);
  const [state, setState] = useState<
    { status: "idle" } | { status: "running" } | { status: "done"; texts: string[] } | { status: "error"; error: string; signIn: boolean }
  >({ status: "idle" });
  const repeat = options.repeat ?? 1;

  async function ask() {
    const res = await fetch(`/api/problems/${slug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        settings: { temperature, maxOutputTokens: options.maxOutputTokens },
        messages: [{ role: "user", content: message }],
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) throw Object.assign(new Error(data?.error ?? "Something went wrong."), { signIn: res?.status === 401 });
    return data.text as string;
  }

  async function run() {
    setState({ status: "running" });
    try {
      const texts = await Promise.all(Array.from({ length: repeat }, ask));
      setState({ status: "done", texts });
    } catch (err) {
      setState({ status: "error", error: (err as Error).message, signIn: Boolean((err as { signIn?: boolean }).signIn) });
    }
  }

  function reset() {
    setPrompt(system);
    setMessage(user);
    setTemperature(options.temperature);
    setState({ status: "idle" });
  }

  const field = "w-full resize-y rounded-md border border-border bg-background p-2.5 font-mono text-xs outline-none focus:border-accent";

  return (
    <div className="not-prose my-5 space-y-3 rounded-xl border border-accent/40 bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Try it</p>
      <label className="block space-y-1">
        <span className="text-xs text-muted">System prompt</span>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Message</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className={field} />
      </label>
      {temperature !== undefined && (
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted">Temperature</span>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-32 accent-[var(--accent)]"
          />
          <span className="font-mono tabular-nums">{temperature.toFixed(1)}</span>
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={state.status === "running" || !message.trim()}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {state.status === "running" ? "Asking the model…" : repeat > 1 ? `Send ${repeat} times` : "Send to model"}
        </button>
        <button onClick={reset} className="text-xs text-muted hover:text-foreground">
          Reset
        </button>
      </div>
      {state.status === "done" && (
        <div className={repeat > 1 ? "grid gap-2 sm:grid-cols-3" : ""}>
          {state.texts.map((text, i) => (
            <div key={i} className="rounded-md border border-border bg-background p-3 text-sm whitespace-pre-wrap">
              <span className="mb-1 block text-xs text-muted">{repeat > 1 ? `Reply ${i + 1}` : "Model reply"}</span>
              {text}
            </div>
          ))}
        </div>
      )}
      {state.status === "error" &&
        (state.signIn ? (
          <p className="text-sm text-muted">
            <SignInButton mode="modal">
              <button className="text-accent underline underline-offset-2">Sign in</button>
            </SignInButton>{" "}
            to talk to the model. It&apos;s free.
          </p>
        ) : (
          <p className="text-sm text-danger">{state.error}</p>
        ))}
    </div>
  );
}
