import { ArrowRight, BookOpen, FlaskConical, Target } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Countdown, PhaseBadge } from "@/components/contests/clock";
import { TrackProgress } from "@/components/tracks/step-list";
import { buttonClass } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";
import { contestPhase } from "@/lib/contest-time";
import { contestNow, listContests } from "@/lib/contests";
import { listTracks } from "@/lib/tracks";

/** The live contest, or the next one coming up. Reads the time, so it streams in after the shell. */
async function ContestTeaser() {
  const now = await contestNow();
  const contests = await listContests();
  const contest =
    contests.find((c) => contestPhase(c, now) === "running") ?? contests.find((c) => contestPhase(c, now) === "upcoming");
  if (!contest) return null;
  return (
    <Link
      href={`/contests/${contest.slug}`}
      className={cardClass({
        interactive: true,
        className: "group mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4",
      })}
    >
      <PhaseBadge startsAt={contest.startsAt} endsAt={contest.endsAt} />
      <span className="font-medium">{contest.title}</span>
      <span className="text-sm text-muted tabular-nums">
        {contest.problems.length} easy problems · <Countdown startsAt={contest.startsAt} endsAt={contest.endsAt} />
      </span>
      <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent">
        Join the contest
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </span>
    </Link>
  );
}

const howItWorks = [
  { Icon: BookOpen, title: "Read a short lesson", body: "Three to five minutes, in plain English. Every new word is explained." },
  { Icon: FlaskConical, title: "Try it live", body: "Change a prompt inside the lesson and see what a real AI model replies." },
  { Icon: Target, title: "Solve an easy problem", body: "Write a prompt that passes hidden tests. Hints and answers are there if you get stuck." },
];

export default async function Home() {
  const tracks = await listTracks();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:py-24">
      <p className="inline-flex h-7 items-center rounded-full bg-accent/10 px-3 text-sm font-medium text-accent ring-1 ring-accent/20 ring-inset">
        Free · no AI experience needed · no code
      </p>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Learn to use and build with AI, from zero.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted text-pretty">
        Short lessons explain how AI models work and how to give them clear instructions. After each lesson you
        practice on a real model, right in your browser. No API keys and no downloads.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={tracks[0] ? `/tracks/${tracks[0].slug}` : "/tracks"}
          className={buttonClass({ size: "lg", className: "group max-w-full pr-4" })}
        >
          <span className="truncate">Start learning: {tracks[0]?.title ?? "Tracks"}</span>
          <ArrowRight
            aria-hidden
            className="size-4 shrink-0 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </Link>
        <Link href="/problems" className="rounded-sm text-sm text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline">
          Already know the basics? Browse all problems
        </Link>
      </div>

      <Suspense>
        <ContestTeaser />
      </Suspense>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {howItWorks.map((step, i) => (
          <div key={step.title} className={cardClass({ className: "p-5" })}>
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">
                <step.Icon className="size-[18px]" strokeWidth={2} />
              </span>
              <p className="text-xs font-medium tracking-wide text-muted uppercase">Step {i + 1}</p>
            </div>
            <h2 className="mt-4 font-semibold">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight">Your learning path</h2>
        <p className="mt-1 text-sm text-muted">Take the tracks in order. Each one builds on the last.</p>
        <ol className="mt-6 space-y-3">
          {tracks.map((track, i) => (
            <li key={track.slug}>
              <Link
                href={`/tracks/${track.slug}`}
                className={cardClass({ interactive: true, className: "group flex gap-4 p-5" })}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium text-muted tabular-nums ring-1 ring-border ring-inset transition-colors duration-150 group-hover:bg-accent/10 group-hover:text-accent group-hover:ring-accent/30">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold transition-colors duration-150 group-hover:text-accent">{track.title}</span>
                    <Suspense>
                      <TrackProgress track={track} />
                    </Suspense>
                  </span>
                  <span className="mt-0.5 block text-xs font-medium tracking-wide text-accent uppercase">{track.level}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted text-pretty">{track.summary}</span>
                  <span className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <BookOpen aria-hidden className="size-3.5" strokeWidth={1.75} />
                    {track.steps.length} lessons
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
