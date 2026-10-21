import { SignInButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarClock, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { DifficultyBadge } from "@/components/badges";
import { Countdown, LiveRefresh, LocalTime, PhaseBadge } from "@/components/contests/clock";
import { JoinButton } from "@/components/contests/join-button";
import { Standings } from "@/components/contests/standings";
import { buttonClass } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";
import { getStandings, type StandingRow } from "@/db/contests";
import { getCurrentUser } from "@/lib/auth";
import { contestPhase } from "@/lib/contest-time";
import { contestNow, getContest, listContests, type Contest } from "@/lib/contests";

export async function generateStaticParams() {
  return (await listContests()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/contests/[slug]">): Promise<Metadata> {
  const contest = await getContest((await props.params).slug);
  return { title: contest?.title ?? "Contest" };
}

// Read once per request and shared by the two live sections below.
const loadViewer = cache(async () => {
  const [user, now] = await Promise.all([getCurrentUser(), contestNow()]);
  return { user, phaseAt: (c: Contest) => contestPhase(c, now) };
});
const loadStandings = cache(async (slug: string) => {
  const contest = await getContest(slug);
  return contest ? getStandings(contest) : [];
});

export default function ContestPage(props: PageProps<"/contests/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Suspense fallback={<div className="h-64 rounded-xl bg-surface-2 motion-safe:animate-pulse" />}>
        <ContestContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function ContestContent({ params }: { params: PageProps<"/contests/[slug]">["params"] }) {
  const contest = await getContest((await params).slug);
  if (!contest) notFound();
  const times = { startsAt: contest.startsAt, endsAt: contest.endsAt };

  return (
    <>
      <Link
        href="/contests"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        All contests
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PhaseBadge {...times} />
        <span className="text-sm font-medium text-muted">
          <Countdown {...times} />
        </span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{contest.title}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted text-pretty">{contest.description}</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted tabular-nums">
        <CalendarClock aria-hidden className="size-4" strokeWidth={1.75} />
        <LocalTime iso={contest.startsAt} />
        <ArrowRight aria-label="to" className="size-3.5" strokeWidth={2} />
        <LocalTime iso={contest.endsAt} /> · {contest.problems.length} problems · {contest.totalPoints} points
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="space-y-6 lg:col-start-2 lg:row-start-1">
          <Suspense fallback={<div className="h-36 rounded-xl bg-surface-2 motion-safe:animate-pulse" />}>
            <YourEntry contest={contest} />
          </Suspense>
          <Rules />
        </aside>
        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-1">
          <Suspense fallback={<div className="h-72 rounded-xl bg-surface-2 motion-safe:animate-pulse" />}>
            <ProblemsAndStandings contest={contest} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

const card = cardClass({ className: "p-5" });

/** Join button, or the viewer's own score once they're in. */
async function YourEntry({ contest }: { contest: Contest }) {
  const { user, phaseAt } = await loadViewer();
  const phase = phaseAt(contest);
  const standings = user ? await loadStandings(contest.slug) : [];
  const me = user ? standings.find((r) => r.userId === user.id) : undefined;

  if (me) {
    const next = contest.problems.find((p) => !me.solved.includes(p.slug) && !me.helped.includes(p.slug));
    return (
      <div className={card}>
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">
          {phase === "ended" ? "Your final result" : "You're in"}
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center [&>div]:rounded-lg [&>div]:bg-surface-2 [&>div]:py-2">
          <Stat label="Rank" value={me.points > 0 ? `#${me.rank}` : "–"} />
          <Stat label="Points" value={me.points} />
          <Stat label="Solved" value={`${me.solved.length}/${contest.problems.length}`} />
        </dl>
        {phase === "upcoming" && (
          <p className="mt-4 text-sm text-muted">
            The problems open when the contest starts. <Countdown startsAt={contest.startsAt} endsAt={contest.endsAt} />.
          </p>
        )}
        {phase === "running" &&
          (next ? (
            <Link
              href={`/problems/${next.slug}`}
              className={buttonClass({ block: true, className: "group mt-4 h-10" })}
            >
              <span className="truncate">Next: {next.title}</span>
              <ArrowRight
                aria-hidden
                className="size-4 shrink-0 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          ) : (
            <p className="mt-4 text-sm text-muted">
              All done. Nice work! Ties are broken by tokens, so a shorter prompt can still move you up.
            </p>
          ))}
      </div>
    );
  }

  if (phase === "ended") {
    return (
      <div className={card}>
        <p className="font-medium">This contest has ended.</p>
        <p className="mt-1 text-sm text-muted">You can still practice its problems. New Submits don&rsquo;t change the ranking.</p>
      </div>
    );
  }

  return (
    <div className={`${card} space-y-3`}>
      <p className="font-medium">Ready to compete?</p>
      <p className="text-sm text-muted">
        Joining is free. Only Submits you make after joining count
        {phase === "upcoming" ? ", and the problems open when the contest starts." : "."}
      </p>
      {user ? (
        <JoinButton slug={contest.slug} />
      ) : (
        <SignInButton mode="modal">
          <button className={buttonClass({ block: true, className: "h-10" })}>
            Sign in to join
          </button>
        </SignInButton>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** The contest rules in plain English. Keep this in sync with getStandings() in src/db/contests.ts. */
function Rules() {
  return (
    <section className={card}>
      <h2 className="font-semibold">How it works</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>
          <strong className="text-foreground">Join</strong> the contest. You need to be signed in.
        </li>
        <li>
          Open a problem and write your prompt as usual. <strong className="text-foreground">Run</strong> tries it on the
          examples and never counts. Only <strong className="text-foreground">Submit</strong> counts. Daily limits still
          apply.
        </li>
        <li>
          A problem is <strong className="text-foreground">solved</strong> when a Submit is Accepted after you joined and
          before the end. It gives you its points.
        </li>
        <li>
          Most points wins. If points are tied, <strong className="text-foreground">fewer tokens</strong> wins (we add up
          your lowest-token Accepted Submit on each problem). If that is tied too, whoever got there first wins.
        </li>
        <li>
          <strong className="text-foreground">Show answer</strong> is off for these problems while you&rsquo;re in the
          contest. If you saw a problem&rsquo;s answer before the end, that problem gives no points. Lessons and hints are
          fine.
        </li>
        <li>Submits after the end don&rsquo;t count. The leaderboard then becomes the final ranking.</li>
      </ol>
    </section>
  );
}

/** The problem list with the viewer's progress, and the live leaderboard. */
async function ProblemsAndStandings({ contest }: { contest: Contest }) {
  const { user, phaseAt } = await loadViewer();
  const phase = phaseAt(contest);
  const standings = await loadStandings(contest.slug);
  const me = user ? standings.find((r) => r.userId === user.id) : undefined;

  return (
    <>
      {phase !== "ended" && <LiveRefresh startsAt={contest.startsAt} endsAt={contest.endsAt} />}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Problems</h2>
        {phase === "upcoming" ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted">
            The {contest.problems.length} problems appear here when the contest starts.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {contest.problems.map((p, i) => (
              <ProblemRow key={p.slug} problem={p} index={i} me={me} />
            ))}
          </ol>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{phase === "ended" ? "Final ranking" : "Leaderboard"}</h2>
          <p className="text-xs text-muted">
            {standings.length} joined{phase === "running" && " · updates every 30 seconds"}
          </p>
        </div>
        <Standings rows={standings} viewerId={user?.id ?? null} problemCount={contest.problems.length} />
      </section>
    </>
  );
}

function ProblemRow({ problem, index, me }: { problem: Contest["problems"][number]; index: number; me?: StandingRow }) {
  const solved = me?.solved.includes(problem.slug);
  const helped = me?.helped.includes(problem.slug);
  return (
    <li className="relative flex items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-surface-2">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums ${
          solved ? "bg-success text-background" : "bg-surface-2 text-muted ring-1 ring-border ring-inset"
        }`}
        aria-label={solved ? "Solved" : `Problem ${index + 1}`}
      >
        {solved ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/problems/${problem.slug}`}
          className="rounded-sm font-medium transition-colors duration-150 after:absolute after:inset-0 hover:text-accent"
        >
          {problem.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <DifficultyBadge difficulty={problem.difficulty} />
          {solved && <span className="font-medium text-success">Solved</span>}
          {helped && <span className="font-medium text-warning">Answer seen, no points</span>}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">{problem.points} pts</span>
    </li>
  );
}
