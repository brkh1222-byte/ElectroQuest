import type { StandingRow } from "@/db/contests";
import { LocalTime } from "./clock";
import { Badge } from "../ui/badge";

const TOP = 50;

function Row({ row, isMe, problemCount }: { row: StandingRow; isMe: boolean; problemCount: number }) {
  const scored = row.points > 0;
  return (
    <tr className={isMe ? "bg-accent/10" : undefined}>
      <td className="px-3 py-2.5 text-muted tabular-nums">{scored ? row.rank : "–"}</td>
      <td className="max-w-0 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny Clerk avatar; next/image adds nothing here
            <img src={row.imageUrl} alt="" className="size-6 shrink-0 rounded-full outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" />
          ) : (
            <span className="size-6 shrink-0 rounded-full bg-surface-2 ring-1 ring-border ring-inset" />
          )}
          <span className="truncate">{row.name}</span>
          {isMe && (
            <Badge tone="accent" className="h-5 px-2">
              you
            </Badge>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right text-muted tabular-nums">
        {row.solved.length}/{problemCount}
      </td>
      <td className="px-3 py-2.5 text-right font-medium tabular-nums">{row.points}</td>
      <td className="hidden px-3 py-2.5 text-right text-muted tabular-nums sm:table-cell">
        {scored ? row.tokens.toLocaleString("en-US") : "–"}
      </td>
      <td className="hidden px-3 py-2.5 text-right text-xs text-muted md:table-cell">
        {row.finishedAt ? <LocalTime iso={row.finishedAt.toISOString()} /> : "–"}
      </td>
    </tr>
  );
}

/** Contest leaderboard: the top learners, plus the viewer's own row when they're further down. */
export function Standings({
  rows,
  viewerId,
  problemCount,
}: {
  rows: StandingRow[];
  viewerId: string | null;
  problemCount: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        No one has joined yet. Be the first!
      </p>
    );
  }
  const top = rows.slice(0, TOP);
  const me = rows.findIndex((r) => r.userId === viewerId) >= TOP ? rows.find((r) => r.userId === viewerId) : undefined;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
    <table className="w-full table-fixed text-sm">
      <thead className="border-b border-border bg-surface-2 text-xs text-muted">
        <tr>
          <th className="w-12 px-3 py-2 text-left font-medium">#</th>
          <th className="px-3 py-2 text-left font-medium">Learner</th>
          <th className="w-16 px-3 py-2 text-right font-medium">Solved</th>
          <th className="w-16 px-3 py-2 text-right font-medium">Points</th>
          <th className="hidden w-24 px-3 py-2 text-right font-medium sm:table-cell">Tokens</th>
          <th className="hidden w-44 px-3 py-2 text-right font-medium md:table-cell">Reached</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {/* Index keys: keys reach the client, and Clerk user ids must not. */}
        {top.map((row, i) => (
          <Row key={i} row={row} isMe={row.userId === viewerId} problemCount={problemCount} />
        ))}
        {me && (
          <>
            <tr aria-hidden>
              <td colSpan={6} className="px-3 py-1 text-center text-xs text-muted">
                &hellip;
              </td>
            </tr>
            <Row row={me} isMe problemCount={problemCount} />
          </>
        )}
      </tbody>
    </table>
    </div>
  );
}
