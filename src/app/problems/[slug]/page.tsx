import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProblemInfo } from "@/components/workspace/problem-info";
import { Workspace } from "@/components/workspace/workspace";
import { opensLater } from "@/lib/contest-config";
import { getProblemContest } from "@/lib/contests";
import { getPublicProblem, listProblems } from "@/lib/problems/loader";
import { findTrackPosition } from "@/lib/tracks";

export async function generateStaticParams() {
  // The bank only: contest-only problems render on demand (they read the clock).
  const problems = await listProblems();
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const problem = await getPublicProblem(slug);
  if (!problem || (await opensLater(problem.config))) return { title: "Problem" };
  return { title: problem.config.title };
}

async function ProblemContent({ params }: { params: PageProps<"/problems/[slug]">["params"] }) {
  const { slug } = await params;
  const [problem, position] = await Promise.all([getPublicProblem(slug), findTrackPosition(slug)]);
  // A contest-only problem is a 404 until its contest starts.
  if (!problem || (await opensLater(problem.config))) notFound();
  // Not awaited: it reads the session, so the contest bar streams in without holding up the page.
  const contest = getProblemContest(slug);

  return (
    <>
      <ProblemInfo problem={problem} position={position} contest={contest} />
      <Workspace problem={problem} />
    </>
  );
}

function ProblemSkeleton() {
  return (
    <>
      <div className="space-y-3 border-border p-5 lg:border-r">
        <div className="h-6 w-1/2 rounded-md bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-1/3 rounded-md bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-32 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
      </div>
      <div className="min-h-72 bg-surface motion-safe:animate-pulse" />
    </>
  );
}

export default function ProblemPage(props: PageProps<"/problems/[slug]">) {
  return (
    <main className="grid flex-1 grid-cols-1 lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Suspense fallback={<ProblemSkeleton />}>
        <ProblemContent params={props.params} />
      </Suspense>
    </main>
  );
}
