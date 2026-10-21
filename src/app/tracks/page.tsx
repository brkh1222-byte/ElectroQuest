import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TrackProgress } from "@/components/tracks/step-list";
import { listTracks } from "@/lib/tracks";

export const metadata: Metadata = { title: "Learn" };

export default async function TracksPage() {
  const tracks = await listTracks();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
      <p className="mt-1 text-sm text-muted">
        Short lessons, each followed by an easy problem that puts it into practice. New to AI? Start with track 1.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tracks.map((track, i) => (
          <Link
            key={track.slug}
            href={`/tracks/${track.slug}`}
            className="group rounded-xl border border-border bg-surface p-5 hover:border-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-accent uppercase">{track.level}</p>
              <Suspense>
                <TrackProgress track={track} />
              </Suspense>
            </div>
            <h2 className="mt-2 text-lg font-semibold group-hover:text-accent">
              {i + 1}. {track.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{track.summary}</p>
            <p className="mt-4 text-xs text-muted">{track.steps.length} lessons</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
