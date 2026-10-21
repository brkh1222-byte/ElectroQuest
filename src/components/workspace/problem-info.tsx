"use client";

import { useState } from "react";
import { DifficultyBadge, TypeBadge } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import type { PublicProblem } from "@/lib/problems/schema";

const tabs = ["Description", "Hints", "Discussion", "Leaderboard"] as const;
type Tab = (typeof tabs)[number];

export function ProblemInfo({ problem }: { problem: PublicProblem }) {
  const [tab, setTab] = useState<Tab>("Description");
  // Tiered hints (spec §9): reveal one at a time; the last one is the editorial.
  const [revealed, setRevealed] = useState(0);

  return (
    <section className="flex min-h-0 flex-col border-border lg:border-r">
      <div className="flex gap-1 border-b border-border px-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm ${
              tab === t ? "border-accent font-medium" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === "Description" && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">{problem.config.title}</h1>
            <div className="mt-2 mb-5 flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={problem.config.difficulty} />
              <TypeBadge type={problem.config.type} />
              {problem.config.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted">
                  #{tag}
                </span>
              ))}
            </div>
            <Markdown>{problem.statement}</Markdown>
          </>
        )}

        {tab === "Hints" && (
          <div className="space-y-3">
            {problem.hints.slice(0, revealed).map((hint) => (
              <div key={hint.title} className="rounded-lg border border-border bg-surface p-4">
                <p className="mb-2 text-sm font-medium">{hint.title}</p>
                <Markdown>{hint.body}</Markdown>
              </div>
            ))}
            {revealed < problem.hints.length ? (
              <button
                onClick={() => setRevealed((n) => n + 1)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface"
              >
                Reveal {problem.hints[revealed].title}
              </button>
            ) : (
              <p className="text-sm text-muted">All hints revealed.</p>
            )}
          </div>
        )}

        {(tab === "Discussion" || tab === "Leaderboard") && (
          <p className="text-sm text-muted">Coming soon.</p>
        )}
      </div>
    </section>
  );
}
