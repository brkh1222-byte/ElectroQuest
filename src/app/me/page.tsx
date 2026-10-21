import type { Metadata } from "next";
import { Suspense } from "react";
import { LearningDashboard } from "@/components/progress/dashboard";

export const metadata: Metadata = { title: "My learning" };

function DashboardSkeleton() {
  return (
    <div className="mt-4 space-y-6" aria-hidden>
      <div className="h-5 w-2/3 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-24 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}

/** "My learning": streak, activity, per-track progress and what to do next. */
export default function MePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My learning</h1>
      {/* Reads the session, so it streams in behind the boundary. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <LearningDashboard />
      </Suspense>
    </main>
  );
}
