"use client";

import { SignInButton } from "@clerk/nextjs";
import { FlaskConical, Loader2, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { labelClass, textareaClass } from "./ui/field";
import { Slider } from "./ui/slider";

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

  return (
    <div className="not-prose my-6 rounded-2xl border border-accent/30 bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <FlaskConical aria-hidden className="size-4 text-accent" strokeWidth={2} />
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">Try it</p>
      </div>
      <div className="space-y-3 p-4">
        <label className="block space-y-1.5">
          <span className={labelClass}>System prompt</span>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className={textareaClass} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Message</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className={textareaClass} />
        </label>
        {temperature !== undefined && (
          <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={labelClass}>Temperature</span>
            <Slider
              min={0}
              max={1.5}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-40"
            />
            <span className="w-7 font-mono tabular-nums">{temperature.toFixed(1)}</span>
          </label>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={run} disabled={state.status === "running" || !message.trim()}>
            {state.status === "running" ? (
              <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" strokeWidth={2} />
            ) : (
              <Send aria-hidden className="size-4" strokeWidth={2} />
            )}
            {state.status === "running" ? "Asking the model…" : repeat > 1 ? `Send ${repeat} times` : "Send to model"}
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw aria-hidden className="size-3.5" strokeWidth={2} />
            Reset
          </Button>
        </div>
        <div aria-live="polite">
          {state.status === "done" && (
            <div className={repeat > 1 ? "stagger grid gap-2 sm:grid-cols-3" : "stagger"}>
              {state.texts.map((text, i) => (
                <div
                  key={i}
                  className="animate-enter rounded-xl border border-border bg-surface-2 p-3 text-sm leading-relaxed whitespace-pre-wrap"
                >
                  <span className="mb-1 block text-xs font-medium text-muted">{repeat > 1 ? `Reply ${i + 1}` : "Model reply"}</span>
                  {text}
                </div>
              ))}
            </div>
          )}
          {state.status === "error" &&
            (state.signIn ? (
              <p className="text-sm text-muted">
                <SignInButton mode="modal">
                  <button className="font-medium text-accent underline underline-offset-2">Sign in</button>
                </SignInButton>{" "}
                to talk to the model. It&apos;s free.
              </p>
            ) : (
              <p className="text-sm text-danger">{state.error}</p>
            ))}
        </div>
      </div>
    </div>
  );
}
