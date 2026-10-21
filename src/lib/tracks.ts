import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { getProblem } from "./problems/loader";
import type { ProblemSummary } from "./problems/schema";

const TRACKS_DIR = path.join(process.cwd(), "tracks");

// Shape of tracks/<slug>.yaml (spec §8): an ordered list of problems, each optionally with a lesson.
const trackConfigSchema = z.object({
  title: z.string(),
  level: z.string(), // e.g. "Beginner · no code"
  summary: z.string(),
  order: z.number().default(100),
  problems: z.array(z.string()).min(1),
});

export type TrackStep = ProblemSummary & { lessonTitle: string | null };
export type Track = Omit<z.infer<typeof trackConfigSchema>, "problems"> & { slug: string; steps: TrackStep[] };

/** A lesson's title is its first "# " heading. */
export function lessonTitle(lesson: string) {
  return lesson.match(/^# (.+)$/m)?.[1].trim() ?? null;
}

async function loadTrack(slug: string): Promise<Track | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(TRACKS_DIR, `${slug}.yaml`), "utf8");
  } catch {
    return null;
  }
  const { problems, ...config } = trackConfigSchema.parse(parseYaml(raw));
  const loaded = await Promise.all(
    problems.map(async (problemSlug): Promise<TrackStep | null> => {
      const p = await getProblem(problemSlug);
      if (!p) throw new Error(`Track "${slug}" lists unknown problem "${problemSlug}"`);
      // Contest-only problems are left out. Tracks are cached and must not depend on the time,
      // so this holds even after the contest ends: delete the problem's `contest:` line to add it.
      if (p.config.contest) return null;
      return {
        slug: p.slug,
        title: p.config.title,
        type: p.config.type,
        difficulty: p.config.difficulty,
        tags: p.config.tags,
        lessonTitle: lessonTitle(p.lesson),
      };
    }),
  );
  const steps = loaded.filter((s): s is TrackStep => s !== null);
  return { slug, ...config, steps };
}

export async function getTrack(slug: string) {
  "use cache";
  cacheLife("hours");
  return loadTrack(slug);
}

export async function listTracks(): Promise<Track[]> {
  "use cache";
  cacheLife("hours");
  const files = (await readdir(TRACKS_DIR)).filter((f) => f.endsWith(".yaml"));
  const tracks = await Promise.all(files.map((f) => loadTrack(f.replace(/\.yaml$/, ""))));
  return tracks.filter((t): t is Track => t !== null).sort((a, b) => a.order - b.order);
}

export type TrackPosition = {
  track: { slug: string; title: string };
  index: number; // 0-based
  total: number;
  prev: TrackStep | null;
  next: TrackStep | null;
  /** The track after this one, offered at the last step. */
  nextTrack: { slug: string; title: string } | null;
};

/** Where a problem sits in the first track that contains it, for "next step" navigation. */
export async function findTrackPosition(problemSlug: string): Promise<TrackPosition | null> {
  const tracks = await listTracks();
  for (const [t, track] of tracks.entries()) {
    const index = track.steps.findIndex((s) => s.slug === problemSlug);
    if (index === -1) continue;
    const after = tracks[t + 1];
    return {
      track: { slug: track.slug, title: track.title },
      index,
      total: track.steps.length,
      prev: track.steps[index - 1] ?? null,
      next: track.steps[index + 1] ?? null,
      nextTrack: after ? { slug: after.slug, title: after.title } : null,
    };
  }
  return null;
}
