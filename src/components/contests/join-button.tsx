"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Joins the contest, then re-renders the page so the viewer's entry and status appear. */
export function JoinButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setJoining(true);
    setError(null);
    const res = await fetch(`/api/contests/${slug}/join`, { method: "POST" }).catch(() => null);
    setJoining(false);
    if (res?.ok) {
      startRefresh(() => router.refresh());
    } else {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Something went wrong. Try again.");
    }
  }

  const busy = joining || refreshing;
  return (
    <div className="space-y-2">
      <button
        onClick={join}
        disabled={busy}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Joining…" : "Join the contest"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
