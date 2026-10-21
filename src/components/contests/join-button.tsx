"use client";

import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "../ui/button";

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
      <Button onClick={join} disabled={busy} block className="h-10">
        {busy ? (
          <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" strokeWidth={2} />
        ) : (
          <Trophy aria-hidden className="size-4" strokeWidth={2} />
        )}
        {busy ? "Joining…" : "Join the contest"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
