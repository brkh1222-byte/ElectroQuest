import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
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
      <div className="h-4 w-40 animate-pulse rounded bg-border" />
      <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-border" />
      <div className="h-64 animate-pulse rounded bg-border/60" />
    </div>
  );
}

/** A lesson page: read, try the ideas live, then go solve the paired problem. */
export default function LessonPage(props: PageProps<"/tracks/[track]/[problem]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
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
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link href={`/tracks/${track.slug}`} className="hover:text-foreground">
          {track.title}
        </Link>
        <span aria-hidden>/</span>
        <span>
          Lesson {index + 1} of {track.steps.length}
        </span>
      </nav>

      <article className="mt-6">
        <Markdown tryItSlug={problem.config.type === "prompt" ? problem.slug : undefined}>{problem.lesson}</Markdown>
      </article>

      <Link
        href={`/problems/${problem.slug}`}
        className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-accent bg-surface p-5 hover:bg-background"
      >
        <span>
          <span className="block text-xs font-medium tracking-wide text-accent uppercase">Now practice it</span>
          <span className="mt-1 block text-lg font-semibold">{problem.config.title}</span>
        </span>
        <span aria-hidden className="text-2xl text-accent">
          →
        </span>
      </Link>

      <div className="mt-8 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={stepHref(track.slug, prev)} className="text-muted hover:text-foreground">
            ← {prev.lessonTitle ?? prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={stepHref(track.slug, next)} className="text-right text-muted hover:text-foreground">
            {next.lessonTitle ?? next.title} →
          </Link>
        )}
        {!next && nextTrack && (
          <Link href={`/tracks/${nextTrack.slug}`} className="text-right text-muted hover:text-foreground">
            Next track: {nextTrack.title} →
          </Link>
        )}
      </div>
    </>
  );
}
