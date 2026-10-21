import type { StandingRow } from "@/db/contests";
import { LocalTime } from "./clock";

const TOP = 50;

function Row({ row, isMe, problemCount }: { row: StandingRow; isMe: boolean; problemCount: number }) {
  const scored = row.points > 0;
  return (
    <tr className={isMe ? "bg-accent/10" : undefined}>
      <td className="px-3 py-2 text-muted tabular-nums">{scored ? row.rank : "–"}</td>
      <td className="px-3 py-2">
        <span className="flex items-center gap-2">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny Clerk avatar; next/image adds nothing here
            <img src={row.imageUrl} alt="" className="size-5 rounded-full" />
          ) : (
            <span className="size-5 rounded-full bg-border" />
          )}
          <span className="truncate">{row.name}</span>
          {isMe && <span className="text-xs text-accent">you</span>}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-muted tabular-nums">
        {row.solved.length}/{problemCount}
      </td>
      <td className="px-3 py-2 text-right font-medium tabular-nums">{row.points}</td>
      <td className="hidden px-3 py-2 text-right text-muted tabular-nums sm:table-cell">
        {scored ? row.tokens.toLocaleString("en-US") : "–"}
      </td>
      <td className="hidden px-3 py-2 text-right text-xs text-muted md:table-cell">
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
    return <p className="mt-3 text-sm text-muted">No one has joined yet. Be the first!</p>;
  }
  const top = rows.slice(0, TOP);
  const me = rows.findIndex((r) => r.userId === viewerId) >= TOP ? rows.find((r) => r.userId === viewerId) : undefined;

  return (
    <table className="mt-3 w-full overflow-hidden rounded-xl border border-border bg-surface text-sm">
      <thead className="border-b border-border text-xs text-muted">
        <tr>
          <th className="w-12 px-3 py-2 text-left font-normal">#</th>
          <th className="px-3 py-2 text-left font-normal">Learner</th>
          <th className="px-3 py-2 text-right font-normal">Solved</th>
          <th className="px-3 py-2 text-right font-normal">Points</th>
          <th className="hidden px-3 py-2 text-right font-normal sm:table-cell">Tokens</th>
          <th className="hidden px-3 py-2 text-right font-normal md:table-cell">Reached</th>
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
                ⋯
              </td>
            </tr>
            <Row row={me} isMe problemCount={problemCount} />
          </>
        )}
      </tbody>
    </table>
  );
}
