"use client";

import { useState } from "react";
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
      <td className="px-3 py-2 text-muted tabular-nums">{row.rank}</td>
      <td className="px-3 py-2">
        <span className="flex items-center gap-2">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny Clerk avatar; next/image adds nothing here
            <img src={row.imageUrl} alt="" className="size-5 rounded-full" />
          ) : (
            <span className="size-5 rounded-full bg-border" />
          )}
          <span className="truncate">{row.name}</span>
          {row.isMe && <span className="text-xs text-accent">you</span>}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-medium tabular-nums">
        {kind === "accuracy" ? `${Math.round(row.score * 100)}%` : row.tokens?.toLocaleString()}
      </td>
      <td className="hidden px-3 py-2 text-right text-xs text-muted sm:table-cell">
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
      <div className="inline-flex rounded-lg border border-border p-0.5 text-sm" role="tablist">
        {(Object.keys(boards) as BoardKind[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-md px-3 py-1 ${kind === k ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-foreground"}`}
          >
            {boards[k].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        {kind === "accuracy"
          ? "Best score on the hidden tests. Ties go to whoever reached it first."
          : "Fewest tokens used on the hidden tests, among Accepted submissions."}
      </p>

      {state.status === "loading" && <p className="text-sm text-muted">Loading leaderboard…</p>}
      {state.status === "error" && <p className="text-sm text-danger">{state.error}</p>}
      {state.status === "ok" &&
        (state.data[kind].top.length === 0 ? (
          <p className="text-sm text-muted">{boards[kind].empty}</p>
        ) : (
          <table className="w-full overflow-hidden rounded-lg border border-border bg-surface text-sm">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="w-12 px-3 py-2 text-left font-normal">#</th>
                <th className="px-3 py-2 text-left font-normal">Learner</th>
                <th className="px-3 py-2 text-right font-normal">{kind === "accuracy" ? "Score" : "Tokens"}</th>
                <th className="hidden px-3 py-2 text-right font-normal sm:table-cell">Reached</th>
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
                      ⋯
                    </td>
                  </tr>
                  <LeaderboardRow row={state.data[kind].me} kind={kind} />
                </>
              )}
            </tbody>
          </table>
        ))}
    </div>
  );
}
