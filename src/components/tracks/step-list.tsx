import Link from "next/link";
import { DifficultyBadge } from "@/components/badges";
import { getRevealedSlugs } from "@/db/answers";
import { getSolvedSlugs } from "@/db/progress";
import { getCurrentUser } from "@/lib/auth";
import { stepHref } from "@/lib/step-href";
import type { Track } from "@/lib/tracks";

export type Progress = { solved: Set<string>; helped: Set<string> };

const noProgress: Progress = { solved: new Set(), helped: new Set() };

/** Solved problems, and which of them were solved after looking at the answer. */
export async function getProgressForUser(userId: string): Promise<Progress> {
  const [solved, revealed] = await Promise.all([getSolvedSlugs(userId), getRevealedSlugs(userId)]);
  return { solved, helped: new Set([...solved].filter((s) => revealed.has(s))) };
}

/** Progress of the signed-in viewer; empty for anonymous visitors. */
export async function getProgressForViewer(): Promise<Progress> {
  const user = await getCurrentUser();
  return user ? getProgressForUser(user.id) : noProgress;
}

/** Ordered steps of a track. Each step is a lesson (when there is one) followed by its problem. */
export function StepList({ track, progress = noProgress }: { track: Track; progress?: Progress }) {
  return (
    <ol className="space-y-3">
      {track.steps.map((step, i) => {
        const done = progress.solved.has(step.slug);
        const helped = progress.helped.has(step.slug);
        return (
          <li key={step.slug} className="flex gap-4 rounded-xl border border-border bg-surface p-4">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                done ? (helped ? "bg-warning text-background" : "bg-success text-background") : "border border-border text-muted"
              }`}
              aria-label={done ? (helped ? "Solved with help" : "Solved") : `Step ${i + 1}`}
              title={helped ? "Solved with help" : undefined}
            >
              {done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={stepHref(track.slug, step)} className="font-medium hover:text-accent">
                {step.lessonTitle ?? step.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                {step.lessonTitle && <span>Lesson, then practice:</span>}
                <Link href={`/problems/${step.slug}`} className="underline-offset-2 hover:text-foreground hover:underline">
                  {step.title}
                </Link>
                <span aria-hidden>·</span>
                <DifficultyBadge difficulty={step.difficulty} />
                {helped && <span className="text-xs text-warning">solved with help</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export async function StepListWithProgress({ track }: { track: Track }) {
  return <StepList track={track} progress={await getProgressForViewer()} />;
}

export async function TrackProgress({ track }: { track: Track }) {
  const { solved } = await getProgressForViewer();
  const done = track.steps.filter((s) => solved.has(s.slug)).length;
  if (done === 0) return null;
  return (
    <span className="text-xs text-muted">
      {done}/{track.steps.length} solved
    </span>
  );
}

const startClass =
  "inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90";

type NextTrack = { slug: string; title: string } | null;

/** "Start with step 1", or "Continue: step N" pointing at the first unsolved step. */
export function ContinueButton({
  track,
  progress = noProgress,
  nextTrack = null,
}: {
  track: Track;
  progress?: Progress;
  /** Offered when the track is complete. */
  nextTrack?: NextTrack;
}) {
  const index = track.steps.findIndex((s) => !progress.solved.has(s.slug));
  if (index === -1) return <TrackComplete track={track} progress={progress} nextTrack={nextTrack} />;
  const step = track.steps[index];
  return (
    <Link href={stepHref(track.slug, step)} className={startClass}>
      {index === 0 ? "Start with step 1" : `Continue: step ${index + 1}`}
    </Link>
  );
}

export async function ContinueButtonWithProgress({ track, nextTrack = null }: { track: Track; nextTrack?: NextTrack }) {
  return <ContinueButton track={track} progress={await getProgressForViewer()} nextTrack={nextTrack} />;
}

/** Shown in place of the Continue button once every step of the track is solved. */
function TrackComplete({ track, progress, nextTrack }: { track: Track; progress: Progress; nextTrack: NextTrack }) {
  const total = track.steps.length;
  const helped = track.steps.filter((s) => progress.helped.has(s.slug)).length;
  return (
    <div className="rounded-xl border border-success/40 bg-success/10 p-5" role="status">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-lg text-background"
        >
          ✓
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-success uppercase">Track complete</p>
          <p className="mt-1 text-lg font-semibold">You finished {track.title}. Well done!</p>
          <p className="mt-1 text-sm text-muted text-pretty">
            {helped === 0
              ? `You solved all ${total} problems on your own.`
              : `You solved all ${total} problems, ${total - helped} on your own and ${helped} with help. Looking at an answer is a good way to learn too.`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        {nextTrack ? (
          <Link href={`/tracks/${nextTrack.slug}`} className={startClass}>
            Next track: {nextTrack.title} →
          </Link>
        ) : (
          <Link href="/problems" className={startClass}>
            Practice more: browse all problems →
          </Link>
        )}
        <Link href="/me" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          See all my progress
        </Link>
      </div>
    </div>
  );
}
