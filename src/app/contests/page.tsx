import type { Metadata } from "next";
import { ArrowRight, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Countdown, LocalTime, PhaseBadge } from "@/components/contests/clock";
import { cardClass } from "@/components/ui/card";
import { countEntries } from "@/db/contests";
import { contestPhase, type ContestPhase } from "@/lib/contest-time";
import { contestNow, listContests, type Contest } from "@/lib/contests";

export const metadata: Metadata = { title: "Contests" };

export default function ContestsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Contests</h1>
      <p className="mt-2 max-w-2xl text-muted text-pretty">
        Weekly challenges on easy prompt problems. Join, solve as many problems as you can before time runs out, and
        see where you rank. Beginners are welcome: you only need the skills from the lessons.
      </p>
      <Suspense fallback={<div className="mt-8 h-40 rounded-xl bg-surface-2 motion-safe:animate-pulse" />}>
        <ContestSections />
      </Suspense>
    </main>
  );
}

const sections: { phase: ContestPhase; title: string }[] = [
  { phase: "running", title: "Live now" },
  { phase: "upcoming", title: "Coming up" },
  { phase: "ended", title: "Past contests" },
];

async function ContestSections() {
  const [contests, now, entries] = await Promise.all([listContests(), contestNow(), countEntries()]);
  const byPhase = (phase: ContestPhase) => {
    const list = contests.filter((c) => contestPhase(c, now) === phase);
    // Running: ending soonest first. Coming up: starting soonest first. Past: most recent first.
    if (phase === "running") return list.sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt));
    return phase === "ended" ? list.reverse() : list;
  };

  const shown = sections.map((s) => ({ ...s, contests: byPhase(s.phase) })).filter((s) => s.contests.length > 0);
  if (!shown.some((s) => s.phase !== "ended")) {
    shown.unshift({ phase: "upcoming", title: "Coming up", contests: [] });
  }

  return (
    <div className="mt-8 space-y-10">
      {shown.map((section) => (
        <section key={section.phase}>
          <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">{section.title}</h2>
          {section.contests.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border p-5 text-sm text-muted">
              <CalendarClock aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
              No contest is running right now. The next one will appear here.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {section.contests.map((c) => (
                <ContestCard key={c.slug} contest={c} joined={entries.get(c.slug) ?? 0} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function ContestCard({ contest, joined }: { contest: Contest; joined: number }) {
  return (
    <Link
      href={`/contests/${contest.slug}`}
      className={cardClass({ interactive: true, className: "group flex flex-col p-5" })}
    >
      <div className="flex items-center justify-between gap-2">
        <PhaseBadge startsAt={contest.startsAt} endsAt={contest.endsAt} />
        <span className="text-xs font-medium text-muted">
          <Countdown startsAt={contest.startsAt} endsAt={contest.endsAt} />
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-balance transition-colors duration-150 group-hover:text-accent">
        {contest.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{contest.description}</p>
      <p className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-4 text-xs text-muted tabular-nums">
        <Users aria-hidden className="size-3.5" strokeWidth={1.75} />
        {contest.problems.length} problems · {contest.totalPoints} points · {joined} joined
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
        <CalendarClock aria-hidden className="size-3.5" strokeWidth={1.75} />
        <LocalTime iso={contest.startsAt} />
        <ArrowRight aria-label="to" className="size-3" strokeWidth={2} />
        <LocalTime iso={contest.endsAt} />
      </p>
    </Link>
  );
}
