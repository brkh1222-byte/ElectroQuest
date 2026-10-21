import Link from "next/link";
import { Suspense } from "react";
import { Countdown, PhaseBadge } from "@/components/contests/clock";
import { TrackProgress } from "@/components/tracks/step-list";
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
      className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface px-5 py-4 hover:border-accent"
    >
      <PhaseBadge startsAt={contest.startsAt} endsAt={contest.endsAt} />
      <span className="font-medium">{contest.title}</span>
      <span className="text-sm text-muted">
        {contest.problems.length} easy problems · <Countdown startsAt={contest.startsAt} endsAt={contest.endsAt} />
      </span>
      <span className="ml-auto text-sm text-accent">Join the contest →</span>
    </Link>
  );
}

const howItWorks = [
  { title: "Read a short lesson", body: "Three to five minutes, in plain English. Every new word is explained." },
  { title: "Try it live", body: "Change a prompt inside the lesson and see what a real AI model replies." },
  { title: "Solve an easy problem", body: "Write a prompt that passes hidden tests. Hints and answers are there if you get stuck." },
];

export default async function Home() {
  const tracks = await listTracks();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:py-24">
      <p className="text-sm font-medium text-accent">Free · no AI experience needed · no code</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Learn to use and build with AI, from zero.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted text-pretty">
        Short lessons explain how AI models work and how to give them clear instructions. After each lesson you
        practice on a real model, right in your browser. No API keys and no downloads.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={tracks[0] ? `/tracks/${tracks[0].slug}` : "/tracks"}
          className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-foreground hover:opacity-90"
        >
          Start learning: {tracks[0]?.title ?? "Tracks"}
        </Link>
        <Link href="/problems" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          Already know the basics? Browse all problems
        </Link>
      </div>

      <Suspense>
        <ContestTeaser />
      </Suspense>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {howItWorks.map((step, i) => (
          <div key={step.title} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Step {i + 1}</p>
            <h2 className="mt-2 font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
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
                className="group flex gap-4 rounded-xl border border-border bg-surface p-5 hover:border-accent"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium text-muted group-hover:border-accent group-hover:text-accent">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold group-hover:text-accent">{track.title}</span>
                    <Suspense>
                      <TrackProgress track={track} />
                    </Suspense>
                  </span>
                  <span className="mt-0.5 block text-xs font-medium tracking-wide text-accent uppercase">{track.level}</span>
                  <span className="mt-2 block text-sm text-muted">{track.summary}</span>
                  <span className="mt-3 block text-xs text-muted">{track.steps.length} lessons</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
