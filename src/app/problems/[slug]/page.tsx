import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProblemInfo } from "@/components/workspace/problem-info";
import { Workspace } from "@/components/workspace/workspace";
import { getPublicProblem, listProblems } from "@/lib/problems/loader";

export async function generateStaticParams() {
  const problems = await listProblems();
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const problem = await getPublicProblem(slug);
  return { title: problem?.config.title ?? "Problem" };
}

async function ProblemContent({ params }: { params: PageProps<"/problems/[slug]">["params"] }) {
  const { slug } = await params;
  const problem = await getPublicProblem(slug);
  if (!problem) notFound();

  return (
    <>
      <ProblemInfo problem={problem} />
      <Workspace problem={problem} />
    </>
  );
}

function ProblemSkeleton() {
  return (
    <>
      <div className="space-y-3 border-border p-5 lg:border-r">
        <div className="h-6 w-1/2 animate-pulse rounded bg-border" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-border" />
        <div className="h-32 animate-pulse rounded bg-border/60" />
      </div>
      <div className="animate-pulse bg-surface" />
    </>
  );
}

export default function ProblemPage(props: PageProps<"/problems/[slug]">) {
  return (
    <main className="grid flex-1 lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Suspense fallback={<ProblemSkeleton />}>
        <ProblemContent params={props.params} />
      </Suspense>
    </main>
  );
}
