import { ArrowRight, Check, Flame, HandHelping, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { computeStreak, getPracticeCounts, getStreakDays, type Streak } from "@/db/progress";
import { getProgressForUser, type Progress } from "@/components/tracks/step-list";
import { getCurrentUser } from "@/lib/auth";
import { stepHref } from "@/lib/step-href";
import { listTracks, type Track, type TrackStep } from "@/lib/tracks";
import { ActivityGrid, gridStart } from "./activity-grid";
import { SignInPrompt } from "./sign-in-prompt";
import { buttonClass as button } from "../ui/button";
import { cardClass } from "../ui/card";

const WEEKS = 8;

const buttonClass = button({ className: "group h-10 pr-3.5" });
const card = cardClass({ className: "p-5" });

function GoArrow() {
  return (
    <ArrowRight
      aria-hidden
      className="size-4 shrink-0 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5"
      strokeWidth={2}
    />
  );
}

type NextUp = { track: Track; step: TrackStep; index: number };

const firstUnsolved = (track: Track, progress: Progress) => track.steps.findIndex((s) => !progress.solved.has(s.slug));

/** The first unsolved step of the first started-but-unfinished track, else of the first unfinished track. */
function findNextUp(tracks: Track[], progress: Progress): NextUp | null {
  const unfinished = tracks.filter((t) => firstUnsolved(t, progress) !== -1);
  const track = unfinished.find((t) => t.steps.some((s) => progress.solved.has(s.slug))) ?? unfinished[0];
  if (!track) return null;
  const index = firstUnsolved(track, progress);
  return { track, step: track.steps[index], index };
}

/** The signed-in learner's dashboard; anonymous visitors get a sign-in prompt. */
export async function LearningDashboard() {
  const user = await getCurrentUser();
  if (!user) {
    const first = (await listTracks())[0];
    return <SignInPrompt startHref={first ? stepHref(first.slug, first.steps[0]) : "/tracks"} />;
  }

  // UTC, like the days recordSubmission writes to streak_days.
  const today = new Date().toISOString().slice(0, 10);
  const [tracks, progress, streakDays, practiceCounts] = await Promise.all([
    listTracks(),
    getProgressForUser(user.id),
    getStreakDays(user.id),
    getPracticeCounts(user.id, gridStart(today, WEEKS)),
  ]);
  const streak = computeStreak(streakDays, today);
  const next = findNextUp(tracks, progress);
  const solvedCount = progress.solved.size;
  const helpedCount = progress.helped.size;

  return (
    <div className="mt-2 space-y-6">
      <p className="text-muted text-pretty">{greeting(solvedCount, streak)}</p>

      <NextUpCard next={next} started={solvedCount > 0} />

      <dl className="grid gap-4 sm:grid-cols-3">
        <StatTile
          Icon={Flame}
          label="Day streak"
          value={streak.current}
          unit={streak.current === 1 ? "day" : "days"}
          note={streak.longest > 0 ? `Your best: ${streak.longest} ${streak.longest === 1 ? "day" : "days"}` : "Solve a problem to start one"}
        />
        <StatTile
          Icon={Trophy}
          label="Solved on your own"
          value={solvedCount - helpedCount}
          unit={solvedCount - helpedCount === 1 ? "problem" : "problems"}
          note={`${solvedCount} solved in total`}
        />
        <StatTile
          Icon={HandHelping}
          label="Solved with help"
          value={helpedCount}
          unit={helpedCount === 1 ? "problem" : "problems"}
          note="You looked at the answer first. That is a fine way to learn."
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <section className={card} aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="font-semibold">
            Your activity
          </h2>
          <p className="mt-1 mb-4 max-w-xs text-sm text-muted">{streakMessage(streak)}</p>
          <ActivityGrid
            today={today}
            weeks={WEEKS}
            solvedDays={new Set(streakDays)}
            practiceCounts={practiceCounts}
          />
        </section>

        <section className={card} aria-labelledby="tracks-heading">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 id="tracks-heading" className="font-semibold">
              Your tracks
            </h2>
            <p className="flex items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success" aria-hidden />
                On your own
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-warning" aria-hidden />
                With help
              </span>
            </p>
          </div>
          <ol className="mt-4 space-y-5">
            {tracks.map((track, i) => (
              <TrackRow key={track.slug} track={track} number={i + 1} progress={progress} />
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function greeting(solved: number, streak: Streak) {
  if (solved === 0) return "Your learning starts here. The first lesson takes about 4 minutes, and you need no AI experience.";
  if (streak.solvedToday) return "Great work today. Every problem you solve makes the next one easier.";
  return `Welcome back. You have solved ${solved} ${solved === 1 ? "problem" : "problems"} so far. Small steps every day add up.`;
}

function streakMessage(streak: Streak) {
  if (streak.solvedToday) return "You solved a problem today. Come back tomorrow to keep your streak going.";
  if (streak.current > 0) return "Solve one problem today to keep your streak going.";
  if (streak.longest > 0) return "Solve one problem today to start a new streak.";
  return "Each day you solve a problem adds one day to your streak.";
}

function StatTile({
  Icon,
  label,
  value,
  unit,
  note,
}: {
  Icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  note: string;
}) {
  return (
    <div className={card}>
      <dt className="flex items-center gap-2 text-sm text-muted">
        <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
        {label}
      </dt>
      <dd className="mt-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="ml-1.5 text-sm text-muted">{unit}</span>
      </dd>
      <dd className="mt-2 text-xs leading-relaxed text-muted text-pretty">{note}</dd>
    </div>
  );
}

function NextUpCard({ next, started }: { next: NextUp | null; started: boolean }) {
  if (!next) {
    return (
      <section className="rounded-2xl border border-success/30 bg-success/10 p-5">
        <p className="text-xs font-semibold tracking-wide text-success uppercase">All tracks complete</p>
        <p className="mt-1 text-lg font-semibold">You finished every track. Amazing work!</p>
        <p className="mt-1 text-sm text-muted">Keep your skills sharp with more problems from the problem bank.</p>
        <Link href="/problems" className={`mt-4 ${buttonClass}`}>
          Browse all problems
          <GoArrow />
        </Link>
      </section>
    );
  }
  const { track, step, index } = next;
  return (
    <section className={cardClass({ tone: "accent", className: "flex flex-wrap items-center justify-between gap-4 p-5" })}>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">{started ? "Next up" : "Start here"}</p>
        <p className="mt-1 text-lg font-semibold text-balance">
          Lesson {index + 1} · {step.lessonTitle ?? step.title}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {track.title}
          {step.lessonTitle && <> · then practice: {step.title}</>}
        </p>
      </div>
      <Link href={stepHref(track.slug, step)} className={buttonClass}>
        {started ? "Continue" : "Start lesson 1"}
        <GoArrow />
      </Link>
    </section>
  );
}

/** Track title, a progress bar split into "on your own" and "with help", and where to go next. */
function TrackRow({ track, number, progress }: { track: Track; number: number; progress: Progress }) {
  const total = track.steps.length;
  const solved = track.steps.filter((s) => progress.solved.has(s.slug)).length;
  const helped = track.steps.filter((s) => progress.helped.has(s.slug)).length;
  const own = solved - helped;
  const index = firstUnsolved(track, progress);
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link href={`/tracks/${track.slug}`} className="rounded-sm font-medium transition-colors duration-150 hover:text-accent">
          {number}. {track.title}
        </Link>
        <span className="text-sm text-muted tabular-nums">
          {solved} of {total} solved
          {helped > 0 && ` · ${helped} with help`}
        </span>
      </div>
      <div
        className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border ring-inset"
        role="progressbar"
        aria-label={`${track.title} progress`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={solved}
        aria-valuetext={`${solved} of ${total} problems solved${helped > 0 ? `, ${helped} with help` : ""}`}
      >
        {own > 0 && (
          <span className="h-full rounded-full bg-success transition-[width] duration-300 ease-out" style={{ width: pct(own) }} />
        )}
        {helped > 0 && (
          <span className="h-full rounded-full bg-warning transition-[width] duration-300 ease-out" style={{ width: pct(helped) }} />
        )}
      </div>
      <div className="mt-2 text-sm">
        {index === -1 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <Check aria-hidden className="size-4" strokeWidth={2.5} />
            Track complete
          </span>
        ) : (
          <Link
            href={stepHref(track.slug, track.steps[index])}
            className="group inline-flex items-center gap-1 rounded-sm font-medium text-accent hover:underline"
          >
            {solved === 0 ? "Start" : "Continue"}: lesson {index + 1} · {track.steps[index].lessonTitle ?? track.steps[index].title}
            <GoArrow />
          </Link>
        )}
      </div>
    </li>
  );
}
