"use client";

import { Puzzle } from "lucide-react";
import { useEffect, useState } from "react";
import { textareaClass } from "./ui/field";

type Encoder = { encode: (text: string) => number[]; decode: (tokens: number[]) => string };

// A few soft colors so neighbouring tokens are easy to tell apart.
const colors = [
  "bg-sky-500/20 ring-sky-500/30",
  "bg-amber-500/25 ring-amber-500/35",
  "bg-emerald-500/20 ring-emerald-500/30",
  "bg-rose-500/20 ring-rose-500/30",
  "bg-violet-500/20 ring-violet-500/30",
];

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
    <div className="not-prose my-6 rounded-2xl border border-accent/30 bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Puzzle aria-hidden className="size-4 text-accent" strokeWidth={2} />
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">Tokenizer</p>
      </div>
      <div className="space-y-3 p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        aria-label="Text to split into tokens"
        className={textareaClass}
      />
      <div className="min-h-12 rounded-xl border border-border bg-surface-2 p-3 font-mono text-sm leading-8 break-words whitespace-pre-wrap">
        {encoder
          ? tokens.map((t, i) => (
              <span key={i} className={`rounded-[3px] px-px py-0.5 ring-1 ring-inset ${colors[i % colors.length]}`}>
                {encoder.decode([t])}
              </span>
            ))
          : <span className="text-xs text-muted">Loading tokenizer…</span>}
      </div>
      <p className="text-xs text-muted">
        <span className="font-medium text-foreground tabular-nums">{tokens.length}</span> tokens ·{" "}
        <span className="tabular-nums">{words}</span> words · <span className="tabular-nums">{text.length}</span> characters
      </p>
      </div>
    </div>
  );
}
