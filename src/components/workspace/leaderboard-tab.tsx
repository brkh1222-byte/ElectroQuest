"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { Tabs } from "../ui/tabs";
import type { PublicProblem } from "@/lib/problems/schema";
import { useOnSubmitted } from "./events";
import { useJson } from "./use-json";

type Row = {
  rank: number;
  name: string;
  imageUrl: string | null;
  score: number;
  tokens: number | null;
  achievedAt: string;
  isMe: boolean;
};
type Board = { top: Row[]; me: Row | null };
type Boards = { accuracy: Board; efficiency: Board };

const boards = {
  accuracy: { label: "Most accurate", empty: "No submissions yet. Be the first on the board." },
  efficiency: { label: "Most efficient", empty: "No accepted submissions yet. Get Accepted to rank by tokens." },
} as const;
type BoardKind = keyof typeof boards;

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function LeaderboardRow({ row, kind }: { row: Row; kind: BoardKind }) {
  return (
    <tr className={row.isMe ? "bg-accent/10" : undefined}>
      <td className="px-3 py-2.5 text-muted tabular-nums">{row.rank}</td>
      <td className="max-w-0 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny Clerk avatar; next/image adds nothing here
            <img src={row.imageUrl} alt="" className="size-6 shrink-0 rounded-full outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" />
          ) : (
            <span className="size-6 shrink-0 rounded-full bg-surface-2 ring-1 ring-border ring-inset" />
          )}
          <span className="truncate">{row.name}</span>
          {row.isMe && (
            <Badge tone="accent" className="h-5 px-2">
              you
            </Badge>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right font-medium tabular-nums">
        {kind === "accuracy" ? `${Math.round(row.score * 100)}%` : row.tokens?.toLocaleString()}
      </td>
      <td className="hidden px-3 py-2.5 text-right text-xs text-muted sm:table-cell">
        {dateFormat.format(new Date(row.achievedAt))}
      </td>
    </tr>
  );
}

export function LeaderboardTab({ problem }: { problem: PublicProblem }) {
  const [state, reload] = useJson<Boards>(`/api/problems/${problem.slug}/leaderboard`);
  const [kind, setKind] = useState<BoardKind>("accuracy");
  useOnSubmitted(reload);

  return (
    <div className="space-y-4">
      <Tabs
        id={`board-${problem.slug}`}
        variant="pill"
        label="Leaderboard"
        items={(Object.keys(boards) as BoardKind[]).map((k) => ({ value: k, label: boards[k].label }))}
        value={kind}
        onChange={setKind}
      />
      <p className="text-xs text-muted">
        {kind === "accuracy"
          ? "Best score on the hidden tests. Ties go to whoever reached it first."
          : "Fewest tokens used on the hidden tests, among Accepted submissions."}
      </p>

      {state.status === "loading" && <p className="text-sm text-muted">Loading leaderboard…</p>}
      {state.status === "error" && <p className="text-sm text-danger">{state.error}</p>}
      {state.status === "ok" &&
        (state.data[kind].top.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">{boards[kind].empty}</p>
        ) : (
          <div className="animate-enter overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-surface-2 text-xs text-muted">
              <tr className="border-b border-border">
                <th className="w-12 px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Learner</th>
                <th className="w-24 px-3 py-2 text-right font-medium">{kind === "accuracy" ? "Score" : "Tokens"}</th>
                <th className="hidden w-32 px-3 py-2 text-right font-medium sm:table-cell">Reached</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.data[kind].top.map((row, i) => (
                <LeaderboardRow key={i} row={row} kind={kind} />
              ))}
              {state.data[kind].me && (
                <>
                  <tr aria-hidden>
                    <td colSpan={4} className="px-3 py-1 text-center text-xs text-muted">
                      &hellip;
                    </td>
                  </tr>
                  <LeaderboardRow row={state.data[kind].me} kind={kind} />
                </>
              )}
            </tbody>
          </table>
          </div>
        ))}
    </div>
  );
}
