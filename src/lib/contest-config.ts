import "server-only";

// Contest YAML parsing and contest-only problem visibility. Kept apart from ./contests so the
// problem loader can use it: ./contests imports the loader, so the loader can't import ./contests.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, io } from "next/cache";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { contestPhase } from "./contest-time";

const CONTESTS_DIR = path.join(process.cwd(), "contests");

// Shape of contests/<slug>.yaml. A problem is a slug, or { slug, points } to change its points.
export const contestConfigSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    problems: z
      .array(z.union([z.string(), z.object({ slug: z.string(), points: z.number().int().positive().optional() })]))
      .min(1),
  })
  .refine((c) => Date.parse(c.endsAt) > Date.parse(c.startsAt), "endsAt must be after startsAt");
export type ContestConfig = z.infer<typeof contestConfigSchema>;

/** Parses contests/<slug>.yaml; null when there is no such file. */
export async function readContestConfig(slug: string): Promise<ContestConfig | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(CONTESTS_DIR, `${slug}.yaml`), "utf8");
  } catch {
    return null;
  }
  return contestConfigSchema.parse(parseYaml(raw));
}

/** The current time. io() keeps anything that depends on it out of the prerendered shell. */
export async function contestNow() {
  await io();
  return Date.now();
}

/** A contest's start and end as UTC ISO strings. Cached: only the dates, never the phase. */
async function getContestTimes(slug: string) {
  "use cache";
  cacheLife("hours");
  const config = await readContestConfig(slug);
  if (!config) return null;
  return { startsAt: new Date(config.startsAt).toISOString(), endsAt: new Date(config.endsAt).toISOString() };
}

/**
 * Phase of the contest a problem is reserved for (`contest:` in problem.yaml), or null for a
 * normal problem. A contest-only problem stays out of the bank while that contest is upcoming or
 * running, and can't be opened before it starts.
 */
export async function reservedContestPhase(config: { contest?: string }, now: number) {
  if (!config.contest) return null;
  const times = await getContestTimes(config.contest);
  if (!times) throw new Error(`problem.yaml names unknown contest "${config.contest}"`);
  return contestPhase(times, now);
}

/** True for a contest-only problem whose contest hasn't started. Reads the clock only for those. */
export async function opensLater(config: { contest?: string }) {
  if (!config.contest) return false;
  return (await reservedContestPhase(config, await contestNow())) === "upcoming";
}
