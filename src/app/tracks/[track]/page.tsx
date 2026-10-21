import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ContinueButton,
  ContinueButtonWithProgress,
  StepList,
  StepListWithProgress,
} from "@/components/tracks/step-list";
import { getTrack, listTracks } from "@/lib/tracks";

export async function generateStaticParams() {
  return (await listTracks()).map((t) => ({ track: t.slug }));
}

export async function generateMetadata(props: PageProps<"/tracks/[track]">): Promise<Metadata> {
  const track = await getTrack((await props.params).track);
  return { title: track?.title ?? "Track" };
}

export default function TrackPage(props: PageProps<"/tracks/[track]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Suspense fallback={<div className="h-64 rounded-xl bg-surface-2 motion-safe:animate-pulse" />}>
        <TrackContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function TrackContent({ params }: { params: PageProps<"/tracks/[track]">["params"] }) {
  const track = await getTrack((await params).track);
  if (!track) notFound();
  // Offered in the celebration once every step is solved.
  const tracks = await listTracks();
  const after = tracks[tracks.findIndex((t) => t.slug === track.slug) + 1];
  const nextTrack = after ? { slug: after.slug, title: after.title } : null;

  return (
    <>
      <Link
        href="/tracks"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        All tracks
      </Link>
      <p className="mt-6 text-xs font-medium tracking-wide text-accent uppercase">{track.level}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{track.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted text-pretty">{track.summary}</p>
      <div className="mt-6">
        <Suspense fallback={<ContinueButton track={track} />}>
          <ContinueButtonWithProgress track={track} nextTrack={nextTrack} />
        </Suspense>
      </div>

      <div className="mt-10">
        <Suspense fallback={<StepList track={track} />}>
          <StepListWithProgress track={track} />
        </Suspense>
      </div>
    </>
  );
}
