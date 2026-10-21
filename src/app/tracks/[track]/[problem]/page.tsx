import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { cardClass } from "@/components/ui/card";
import { getProblem } from "@/lib/problems/loader";
import { stepHref } from "@/lib/step-href";
import { getTrack, listTracks } from "@/lib/tracks";

export async function generateStaticParams() {
  const tracks = await listTracks();
  return tracks.flatMap((t) => t.steps.filter((s) => s.lessonTitle).map((s) => ({ track: t.slug, problem: s.slug })));
}

async function load(params: PageProps<"/tracks/[track]/[problem]">["params"]) {
  const { track: trackSlug, problem: problemSlug } = await params;
  const [track, problem] = await Promise.all([getTrack(trackSlug), getProblem(problemSlug)]);
  const index = track?.steps.findIndex((s) => s.slug === problemSlug) ?? -1;
  if (!track || !problem?.lesson || index === -1) return null;
  const tracks = await listTracks();
  const nextTrack = tracks[tracks.findIndex((t) => t.slug === track.slug) + 1] ?? null;
  return { track, problem, index, nextTrack };
}

export async function generateMetadata(props: PageProps<"/tracks/[track]/[problem]">): Promise<Metadata> {
  const loaded = await load(props.params);
  return { title: loaded?.track.steps[loaded.index].lessonTitle ?? "Lesson" };
}

function LessonSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-40 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="mt-6 h-9 w-2/3 rounded-lg bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-64 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}

/** A lesson page: read, try the ideas live, then go solve the paired problem. */
export default function LessonPage(props: PageProps<"/tracks/[track]/[problem]">) {
  return (
    <main className="mx-auto w-full max-w-[46rem] flex-1 px-4 py-8 sm:py-12">
      <Suspense fallback={<LessonSkeleton />}>
        <LessonContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function LessonContent({ params }: { params: PageProps<"/tracks/[track]/[problem]">["params"] }) {
  const loaded = await load(params);
  if (!loaded) notFound();
  const { track, problem, index, nextTrack } = loaded;
  const prev = track.steps[index - 1];
  const next = track.steps[index + 1];

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
        <Link
          href={`/tracks/${track.slug}`}
          className="truncate rounded-sm transition-colors duration-150 hover:text-foreground"
        >
          {track.title}
        </Link>
        <ChevronRight aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
        <span className="shrink-0 tabular-nums">
          Lesson {index + 1} of {track.steps.length}
        </span>
      </nav>

      <article className="lesson-article mt-6">
        <Markdown tryItSlug={problem.config.type === "prompt" ? problem.slug : undefined}>{problem.lesson}</Markdown>
      </article>

      <Link
        href={`/problems/${problem.slug}`}
        className={cardClass({
          tone: "accent",
          interactive: true,
          className: "group mt-12 flex items-center gap-4 p-5 hover:border-accent",
        })}
      >
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <Dumbbell className="size-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold tracking-wide text-accent uppercase">Now practice it</span>
          <span className="mt-0.5 block text-lg font-semibold text-balance">{problem.config.title}</span>
        </span>
        <ArrowRight
          aria-hidden
          className="size-5 shrink-0 text-accent transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </Link>

      <nav aria-label="Lessons" className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        {prev ? (
          <Link href={stepHref(track.slug, prev)} className={cardClass({ interactive: true, className: "group flex flex-col gap-1 p-4" })}>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <ArrowLeft aria-hidden className="size-3.5" strokeWidth={2} />
              Previous
            </span>
            <span className="font-medium text-foreground">{prev.lessonTitle ?? prev.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {(next || nextTrack) && (
          <Link
            href={next ? stepHref(track.slug, next) : `/tracks/${nextTrack!.slug}`}
            className={cardClass({ interactive: true, className: "group flex flex-col items-end gap-1 p-4 text-right" })}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted">
              {next ? "Next" : "Next track"}
              <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
            </span>
            <span className="font-medium text-foreground">{next ? (next.lessonTitle ?? next.title) : nextTrack!.title}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
