const DAY_MS = 86_400_000;

export type DayLevel = "none" | "practiced" | "solved";
type Cell = { day: string; level: DayLevel; future: boolean };

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const parse = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** The Monday that starts the grid: `weeks` whole weeks (Monday to Sunday), the last one holding today. */
export function gridStart(today: string, weeks: number) {
  const t = parse(today);
  const weekday = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  return iso(t - (weekday + (weeks - 1) * 7) * DAY_MS);
}

function buildWeeks(today: string, weeks: number, level: (day: string) => DayLevel): Cell[][] {
  const start = parse(gridStart(today, weeks));
  const todayMs = parse(today);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const ms = start + (w * 7 + d) * DAY_MS;
      const day = iso(ms);
      return { day, level: level(day), future: ms > todayMs };
    }),
  );
}

const cellClass: Record<DayLevel, string> = {
  none: "bg-border",
  practiced: "bg-accent/40",
  solved: "bg-success",
};

const levelText: Record<DayLevel, string> = {
  none: "no practice",
  practiced: "practiced",
  solved: "solved a problem",
};

const formatDay = (day: string) =>
  new Date(parse(day)).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });

const tries = (n: number) => (n === 0 ? "" : ` (${n} ${n === 1 ? "run or submit" : "runs and submits"})`);

const weekdayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

/**
 * A small calendar of the last few weeks: one column per week, one square per day. Days are
 * UTC, like the streak. Each square's tooltip names the day and what happened.
 */
export function ActivityGrid({
  today,
  weeks = 8,
  solvedDays,
  practiceCounts,
}: {
  today: string;
  weeks?: number;
  solvedDays: Set<string>;
  practiceCounts: Map<string, number>;
}) {
  const grid = buildWeeks(today, weeks, (day) =>
    solvedDays.has(day) ? "solved" : (practiceCounts.get(day) ?? 0) > 0 ? "practiced" : "none",
  );
  const past = grid.flat().filter((c) => !c.future);
  const active = past.filter((c) => c.level !== "none").length;
  const solved = past.filter((c) => c.level === "solved").length;
  const summary = `In the last ${weeks} weeks you practiced on ${active} ${active === 1 ? "day" : "days"} and solved a problem on ${solved} of them.`;

  return (
    <figure>
      <div className="flex gap-2" role="img" aria-label={summary}>
        <div className="grid grid-rows-7 gap-[3px] text-[10px] leading-none text-muted" aria-hidden>
          {weekdayLabels.map((label, i) => (
            <span key={i} className="flex h-3.5 items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" aria-hidden>
          {grid.flat().map((cell) =>
            cell.future ? (
              <span key={cell.day} className="size-3.5" />
            ) : (
              <span
                key={cell.day}
                title={`${formatDay(cell.day)}: ${levelText[cell.level]}${tries(practiceCounts.get(cell.day) ?? 0)}`}
                className={`size-3.5 rounded-[3px] ${cellClass[cell.level]} ${
                  cell.day === today ? "ring-2 ring-foreground/40 ring-offset-1 ring-offset-surface" : ""
                }`}
              />
            ),
          )}
        </div>
      </div>
      <figcaption className="mt-3 space-y-2 text-xs text-muted">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {(["none", "practiced", "solved"] as const).map((level) => (
            <span key={level} className="inline-flex items-center gap-1.5">
              <span className={`size-2.5 rounded-[2px] ${cellClass[level]}`} aria-hidden />
              {level === "none" ? "No practice" : level === "practiced" ? "Practiced" : "Solved a problem"}
            </span>
          ))}
        </span>
        <span className="block">{summary}</span>
      </figcaption>
    </figure>
  );
}
