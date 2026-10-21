import type { Metadata } from "next";
import { ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DifficultyBadge, TypeBadge } from "@/components/badges";
import { listProblems } from "@/lib/problems/loader";

export const metadata: Metadata = { title: "Problems" };

// listProblems() reads the clock to hide contest-only problems, so the list streams in.
export default function ProblemsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Problems</h1>
      <Suspense fallback={<p className="mt-1 text-sm text-muted">&nbsp;</p>}>
        <ProblemCount />
      </Suspense>
      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
        <GraduationCap aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={2} />
        New to AI? Problems make more sense after their lessons.
        <Link href="/tracks" className="inline-flex items-center gap-1 rounded-sm font-medium text-accent hover:underline">
          Start with the learning path
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
        </Link>
      </p>

      <Suspense fallback={<div className="mt-6 h-96 rounded-xl bg-surface-2 motion-safe:animate-pulse" />}>
        <ProblemTable />
      </Suspense>
    </main>
  );
}

async function ProblemCount() {
  const problems = await listProblems();
  return <p className="mt-1 text-sm text-muted tabular-nums">{problems.length} problems</p>;
}

async function ProblemTable() {
  const problems = await listProblems();
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-transparent bg-surface shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-2 text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Tags</th>
            <th className="px-4 py-3 font-medium">Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr key={p.slug} className="relative border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-2">
              <td className="px-4 py-3">
                <Link
                  href={`/problems/${p.slug}`}
                  className="rounded-sm font-medium transition-colors duration-150 after:absolute after:inset-0 hover:text-accent"
                >
                  {p.title}
                </Link>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <TypeBadge type={p.type} />
              </td>
              <td className="hidden px-4 py-3 text-muted md:table-cell">{p.tags.join(", ")}</td>
              <td className="px-4 py-3">
                <DifficultyBadge difficulty={p.difficulty} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
