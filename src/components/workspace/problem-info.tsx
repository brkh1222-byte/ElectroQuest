"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { DifficultyBadge, TypeBadge } from "@/components/badges";
import { AnswerGate, ContestBar } from "@/components/contests/problem-contest";
import { Markdown } from "@/components/markdown";
import type { ProblemContest } from "@/lib/contests";
import type { PublicProblem } from "@/lib/problems/schema";
import { stepHref } from "@/lib/step-href";
import type { TrackPosition } from "@/lib/tracks";
import { LeaderboardTab } from "./leaderboard-tab";
import { ShowAnswer } from "./show-answer";
import { SubmissionsTab } from "./submissions-tab";
import { buttonClass } from "../ui/button";
import { tabId, tabPanelId, Tabs } from "../ui/tabs";

const allTabs = ["Description", "Lesson", "Hints", "Submissions", "Leaderboard", "Discussion"] as const;
type Tab = (typeof allTabs)[number];

/** "Prompting 101 · Step 2 of 5" with a link onward, for problems that belong to a track. */
function TrackBar({ position }: { position: TrackPosition }) {
  const { track, index, total, next, nextTrack } = position;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface-2/60 px-5 py-2 text-xs text-muted">
      <Link href={`/tracks/${track.slug}`} className="rounded-sm font-medium text-foreground transition-colors duration-150 hover:text-accent">
        {track.title}
      </Link>
      <span className="tabular-nums">
        Step {index + 1} of {total}
      </span>
      {next && (
        <Link href={stepHref(track.slug, next)} className="ml-auto inline-flex items-center gap-1 rounded-sm transition-colors duration-150 hover:text-foreground">
          Next: {next.lessonTitle ?? next.title}
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
        </Link>
      )}
      {!next && nextTrack && (
        <Link href={`/tracks/${nextTrack.slug}`} className="ml-auto inline-flex items-center gap-1 rounded-sm transition-colors duration-150 hover:text-foreground">
          Next track: {nextTrack.title}
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

export function ProblemInfo({
  problem,
  position,
  contest,
}: {
  problem: PublicProblem;
  position: TrackPosition | null;
  /** The running contest this problem is in; it streams in after the page (it reads the session). */
  contest?: Promise<ProblemContest | null>;
}) {
  const [tab, setTab] = useState<Tab>("Description");
  // From-scratch tests are public, so those problems have no leaderboard (spec §3.3).
  const tabs = allTabs.filter(
    (t) => (t !== "Leaderboard" || problem.config.type !== "scratch") && (t !== "Lesson" || problem.lesson),
  );
  // Tiered hints (spec §9): reveal one at a time. The answer sits behind a warning after them.
  const [revealed, setRevealed] = useState(0);

  return (
    <section className="flex min-h-0 flex-col border-border lg:border-r">
      {contest && (
        <Suspense>
          <ContestBar contest={contest} />
        </Suspense>
      )}
      {position && <TrackBar position={position} />}
      <div className="shrink-0 overflow-x-auto border-b border-border px-2 [scrollbar-width:none]">
        <Tabs
          id={`info-${problem.slug}`}
          label="Problem"
          items={tabs.map((t) => ({ value: t, label: t }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId(`info-${problem.slug}`)}
        aria-labelledby={tabId(`info-${problem.slug}`, tab)}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
      >
        {tab === "Description" && (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-balance">{problem.config.title}</h1>
            <div className="mt-2 mb-5 flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={problem.config.difficulty} />
              <TypeBadge type={problem.config.type} />
              {problem.config.tags.map((tag) => (
                <span key={tag} className="font-mono text-xs text-muted">
                  #{tag}
                </span>
              ))}
            </div>
            <Markdown>{problem.statement}</Markdown>
          </>
        )}

        {tab === "Lesson" && (
          <Markdown tryItSlug={problem.config.type === "prompt" ? problem.slug : undefined}>{problem.lesson}</Markdown>
        )}

        {tab === "Hints" && (
          <div className="space-y-3">
            {problem.hints.slice(0, revealed).map((hint) => (
              <div key={hint.title} className="animate-enter rounded-xl border border-warning/30 bg-warning/5 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Lightbulb aria-hidden className="size-4 text-warning" strokeWidth={2} />
                  {hint.title}
                </p>
                <Markdown>{hint.body}</Markdown>
              </div>
            ))}
            {revealed < problem.hints.length ? (
              <button onClick={() => setRevealed((n) => n + 1)} className={buttonClass({ variant: "secondary" })}>
                <Lightbulb aria-hidden className="size-4 text-warning" strokeWidth={2} />
                Reveal {problem.hints[revealed].title}
              </button>
            ) : (
              problem.hints.length > 0 && <p className="text-sm text-muted">All hints revealed.</p>
            )}
            <div className="border-t border-border pt-3">
              <AnswerGate contest={contest}>
                <ShowAnswer key={problem.slug} problem={problem} />
              </AnswerGate>
            </div>
          </div>
        )}

        {tab === "Submissions" && <SubmissionsTab problem={problem} />}
        {tab === "Leaderboard" && <LeaderboardTab problem={problem} />}
        {tab === "Discussion" && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">Coming soon.</p>
        )}
      </div>
    </section>
  );
}
