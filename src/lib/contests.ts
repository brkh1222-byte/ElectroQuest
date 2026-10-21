import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { hasJoined } from "@/db/contests";
import { getCurrentUser } from "./auth";
import { contestNow, readContestConfig } from "./contest-config";
import { contestPhase } from "./contest-time";
import { getProblem } from "./problems/loader";
import type { ProblemSummary } from "./problems/schema";

const CONTESTS_DIR = path.join(process.cwd(), "contests");
const DEFAULT_POINTS = 100;

export type ContestProblem = ProblemSummary & { points: number };
export type Contest = {
  slug: string;
  title: string;
  description: string;
  /** Normalized to UTC ISO strings so they compare and serialize the same everywhere. */
  startsAt: string;
  endsAt: string;
  problems: ContestProblem[];
  totalPoints: number;
};

async function loadContest(slug: string): Promise<Contest | null> {
  const config = await readContestConfig(slug);
  if (!config) return null;
  const problems = await Promise.all(
    config.problems.map(async (entry): Promise<ContestProblem> => {
      const { slug: problemSlug, points = DEFAULT_POINTS } = typeof entry === "string" ? { slug: entry } : entry;
      const p = await getProblem(problemSlug);
      if (!p) throw new Error(`Contest "${slug}" lists unknown problem "${problemSlug}"`);
      // From-scratch problems are graded in the browser, so their results can't be trusted for ranking.
      if (p.config.type === "scratch") throw new Error(`Contest "${slug}" lists from-scratch problem "${problemSlug}"`);
      // A contest-only problem is hidden until its own contest ends, so it can't serve another one.
      if (p.config.contest && p.config.contest !== slug) {
        throw new Error(`Contest "${slug}" lists "${problemSlug}", which is reserved for contest "${p.config.contest}"`);
      }
      return { slug: p.slug, title: p.config.title, type: p.config.type, difficulty: p.config.difficulty, tags: p.config.tags, points };
    }),
  );
  return {
    slug,
    title: config.title,
    description: config.description,
    startsAt: new Date(config.startsAt).toISOString(),
    endsAt: new Date(config.endsAt).toISOString(),
    problems,
    totalPoints: problems.reduce((sum, p) => sum + p.points, 0),
  };
}

export async function getContest(slug: string) {
  "use cache";
  cacheLife("hours");
  return loadContest(slug);
}

/** All contests, oldest start first. */
export async function listContests(): Promise<Contest[]> {
  "use cache";
  cacheLife("hours");
  let files: string[];
  try {
    files = (await readdir(CONTESTS_DIR)).filter((f) => f.endsWith(".yaml"));
  } catch {
    return [];
  }
  const contests = await Promise.all(files.map((f) => loadContest(f.replace(/\.yaml$/, ""))));
  return contests
    .filter((c): c is Contest => c !== null)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export { contestNow };

/** Running contests that include a problem, ending soonest first. */
async function runningContestsWith(problemSlug: string, now: number) {
  return (await listContests())
    .filter((c) => contestPhase(c, now) === "running" && c.problems.some((p) => p.slug === problemSlug))
    .sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt));
}

/**
 * The running contest the user joined that includes this problem, if any. While it runs,
 * "Show answer" is off for its problems.
 */
export async function findAnswerLock(userId: string, problemSlug: string) {
  for (const contest of await runningContestsWith(problemSlug, await contestNow())) {
    if (await hasJoined(contest.slug, userId)) return contest;
  }
  return null;
}

/** What the problem page's contest bar shows. */
export type ProblemContest = {
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  points: number;
  /** The viewer joined, so "Show answer" is off for this problem until the end. */
  joined: boolean;
};

/**
 * The running contest a problem belongs to, preferring one the viewer joined. Never throws:
 * a failure here only hides the contest bar.
 */
export async function getProblemContest(problemSlug: string): Promise<ProblemContest | null> {
  try {
    const running = await runningContestsWith(problemSlug, await contestNow());
    if (running.length === 0) return null;
    const user = await getCurrentUser();
    const joined = user ? await findAnswerLock(user.id, problemSlug) : null;
    const contest = joined ?? running[0];
    return {
      slug: contest.slug,
      title: contest.title,
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      points: contest.problems.find((p) => p.slug === problemSlug)?.points ?? DEFAULT_POINTS,
      joined: joined !== null,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("Contest lookup failed", err);
    return null;
  }
}
