"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { contestPhase, formatDuration } from "@/lib/contest-time";
import { Badge } from "../ui/badge";

type Times = { startsAt: string; endsAt: string };

// One shared one-second ticker for every countdown on the page. The time is only read in the
// browser: the server snapshot is 0, so nothing time-dependent lands in the prerendered HTML.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

/** Milliseconds since the epoch, updated every second; null until hydrated. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, () => now, () => 0) || null;
}

/** "Starts in 2h 5m" / "Ends in 6d 23h" / "Ended". */
export function Countdown({ startsAt, endsAt }: Times) {
  const t = useNow();
  if (t === null) return <span className="tabular-nums">&nbsp;</span>;
  const phase = contestPhase({ startsAt, endsAt }, t);
  return (
    <span className="tabular-nums">
      {phase === "upcoming" && `Starts in ${formatDuration(Date.parse(startsAt) - t)}`}
      {phase === "running" && `Ends in ${formatDuration(Date.parse(endsAt) - t)}`}
      {phase === "ended" && "Ended"}
    </span>
  );
}

const phaseStyle = {
  upcoming: { label: "Coming up", tone: "accent" },
  running: { label: "Live now", tone: "success" },
  ended: { label: "Ended", tone: "neutral" },
} as const;

export function PhaseBadge({ startsAt, endsAt }: Times) {
  const t = useNow();
  if (t === null) return <span className="inline-block h-6 w-20 rounded-full bg-surface-2 ring-1 ring-border ring-inset" />;
  const phase = contestPhase({ startsAt, endsAt }, t);
  const { label, tone } = phaseStyle[phase];
  return (
    <Badge tone={tone} dot={phase === "running"} pulse={phase === "running"}>
      {label}
    </Badge>
  );
}

const utcFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const localFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const noop = () => () => {};

/** A date in the viewer's time zone (UTC in the server HTML, then local after hydration). */
export function LocalTime({ iso }: { iso: string }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const date = new Date(iso);
  return (
    <time dateTime={iso}>
      {hydrated ? localFormat.format(date) : `${utcFormat.format(date)} UTC`}
    </time>
  );
}

/**
 * Keeps the server-rendered parts of a contest page fresh: refreshes every `every` ms while
 * the contest runs and the tab is visible, and right when it starts and ends.
 */
export function LiveRefresh({ startsAt, endsAt, every = 30_000 }: Times & { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && contestPhase({ startsAt, endsAt }, Date.now()) === "running") {
        router.refresh();
      }
    }, every);
    const timeouts = [startsAt, endsAt]
      .map((iso) => Date.parse(iso) - Date.now())
      .filter((ms) => ms > 0 && ms < 2 ** 31 - 1) // setTimeout's maximum delay
      .map((ms) => setTimeout(() => router.refresh(), ms + 1000));
    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [router, startsAt, endsAt, every]);
  return null;
}
