"use client";

import { useEffect, useState } from "react";

type Encoder = { encode: (text: string) => number[]; decode: (tokens: number[]) => string };

// A few soft colors so neighbouring tokens are easy to tell apart.
const colors = ["bg-sky-500/20", "bg-amber-500/25", "bg-emerald-500/20", "bg-rose-500/20", "bg-violet-500/20"];

/**
 * A ```tokens block in a lesson: type text and see how a model splits it into tokens.
 * Runs in the browser with an OpenAI tokenizer; other models split text a little differently.
 */
export function TokenViewer({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [encoder, setEncoder] = useState<Encoder | null>(null);

  useEffect(() => {
    // The vocabulary is a few MB, so it loads only when a lesson needs it.
    import("gpt-tokenizer/encoding/o200k_base").then((m) => setEncoder(m), () => {});
  }, []);

  const tokens = encoder ? encoder.encode(text) : [];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="not-prose my-5 space-y-3 rounded-xl border border-accent/40 bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Tokenizer</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        aria-label="Text to split into tokens"
        className="w-full resize-y rounded-md border border-border bg-background p-2.5 font-mono text-xs outline-none focus:border-accent"
      />
      <div className="min-h-10 rounded-md border border-border bg-background p-2.5 font-mono text-sm leading-7 break-words whitespace-pre-wrap">
        {encoder
          ? tokens.map((t, i) => (
              <span key={i} className={`rounded-sm px-px ${colors[i % colors.length]}`}>
                {encoder.decode([t])}
              </span>
            ))
          : <span className="text-xs text-muted">Loading tokenizer…</span>}
      </div>
      <p className="text-xs text-muted">
        <span className="font-medium text-foreground tabular-nums">{tokens.length}</span> tokens ·{" "}
        <span className="tabular-nums">{words}</span> words · {text.length} characters
      </p>
    </div>
  );
}
