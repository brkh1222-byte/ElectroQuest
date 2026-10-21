"use client";

import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { Suspense, use, type ReactNode } from "react";
import type { ProblemContest } from "@/lib/contests";
import { Countdown } from "./clock";

/** Shown above a problem that is part of a running contest: name, points and time left. */
export function ContestBar({ contest }: { contest: Promise<ProblemContest | null> }) {
  const c = use(contest);
  if (!c) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-accent/30 bg-accent/10 px-5 py-2 text-xs">
      <span className="flex items-center gap-1.5 font-semibold tracking-wide text-accent uppercase">
        <Trophy aria-hidden className="size-3.5" strokeWidth={2} />
        Contest
      </span>
      <Link href={`/contests/${c.slug}`} className="rounded-sm font-medium text-foreground transition-colors duration-150 hover:text-accent">
        {c.title}
      </Link>
      <span className="text-muted tabular-nums">{c.points} points</span>
      <span className="text-muted tabular-nums">
        <Countdown startsAt={c.startsAt} endsAt={c.endsAt} />
      </span>
      {c.joined ? (
        <span className="ml-auto text-muted">You&rsquo;re in. Show answer is off until it ends.</span>
      ) : (
        <Link href={`/contests/${c.slug}`} className="ml-auto inline-flex items-center gap-1 rounded-sm font-medium text-accent hover:underline">
          Join to compete
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

function Gate({ contest, children }: { contest: Promise<ProblemContest | null>; children: ReactNode }) {
  const c = use(contest);
  if (!c?.joined) return children;
  return (
    <p className="text-sm text-muted">
      Show answer is off while you&rsquo;re in{" "}
      <Link href={`/contests/${c.slug}`} className="text-accent hover:underline">
        {c.title}
      </Link>
      . It comes back when the contest ends.
    </p>
  );
}

/** Replaces "Show answer" with a short note for contest participants (the server refuses it too). */
export function AnswerGate({ contest, children }: { contest?: Promise<ProblemContest | null>; children: ReactNode }) {
  if (!contest) return children;
  return (
    <Suspense fallback={children}>
      <Gate contest={contest}>{children}</Gate>
    </Suspense>
  );
}
