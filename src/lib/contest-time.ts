// Contest clock helpers, shared by server code and the client countdowns.

export type ContestPhase = "upcoming" | "running" | "ended";

/** A contest runs from startsAt (inclusive) until endsAt (exclusive). */
export function contestPhase(contest: { startsAt: string; endsAt: string }, now: number): ContestPhase {
  if (now < Date.parse(contest.startsAt)) return "upcoming";
  return now < Date.parse(contest.endsAt) ? "running" : "ended";
}

/** "6d 23h", "4h 12m" or "3m 05s": the two largest units, for countdowns. */
export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(s % 60).padStart(2, "0")}s`;
}
