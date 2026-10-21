import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { TrackProgress } from "@/components/tracks/step-list";
import { cardClass } from "@/components/ui/card";
import { listTracks } from "@/lib/tracks";

export const metadata: Metadata = { title: "Learn" };

export default async function TracksPage() {
  const tracks = await listTracks();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
      <p className="mt-2 max-w-2xl text-muted text-pretty">
        Short lessons, each followed by an easy problem that puts it into practice. New to AI? Start with track 1.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tracks.map((track, i) => (
          <Link
            key={track.slug}
            href={`/tracks/${track.slug}`}
            className={cardClass({ interactive: true, className: "group flex flex-col p-5" })}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-accent uppercase">{track.level}</p>
              <Suspense>
                <TrackProgress track={track} />
              </Suspense>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-balance transition-colors duration-150 group-hover:text-accent">
              {i + 1}. {track.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{track.summary}</p>
            <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted">
              <BookOpen aria-hidden className="size-3.5" strokeWidth={1.75} />
              {track.steps.length} lessons
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
