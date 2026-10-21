import type { Metadata } from "next";
import Link from "next/link";
import { DifficultyBadge, TypeBadge } from "@/components/badges";
import { listProblems } from "@/lib/problems/loader";

export const metadata: Metadata = { title: "Problems" };

export default async function ProblemsPage() {
  const problems = await listProblems();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
      <p className="mt-1 text-sm text-muted">{problems.length} problems</p>
      <p className="mt-4 rounded-lg border border-accent/40 bg-surface px-4 py-3 text-sm">
        New to AI? Problems make more sense after their lessons.{" "}
        <Link href="/tracks" className="font-medium text-accent hover:underline">
          Start with the learning path →
        </Link>
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Tags</th>
              <th className="px-4 py-3 font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p.slug} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-4 py-3">
                  <Link href={`/problems/${p.slug}`} className="font-medium hover:text-accent">
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
    </main>
  );
}
