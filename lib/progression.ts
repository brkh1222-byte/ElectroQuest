import type { Completion, Repair } from "./db";
import { recipes } from "./data";

/**
 * Light game layer: level-2 recipes unlock after one level-1 project, level 3 after two level-2 projects.
 * Demo mode unlocks everything so the stage demo isn't blocked.
 */
export function unlockedLevels(completions: Completion[], demo = false): Set<number> {
  if (demo) return new Set([1, 2, 3]);
  const done = new Set(completions.map((c) => c.id));
  const countAt = (lvl: number) => recipes.filter((r) => r.difficulty === lvl && done.has(r.id)).length;
  const levels = new Set([1]);
  if (countAt(1) >= 1) levels.add(2);
  if (countAt(2) >= 2) levels.add(3);
  return levels;
}

export type BadgeId = "first_circuit" | "first_repair" | "saved_device" | "salvager" | "arduino" | "level3";

export function earnedBadges(completions: Completion[], repairs: Repair[]): Set<BadgeId> {
  const b = new Set<BadgeId>();
  const done = new Set(completions.map((c) => c.id));
  const doneRecipes = recipes.filter((r) => done.has(r.id));
  if (doneRecipes.length > 0) b.add("first_circuit");
  if (doneRecipes.some((r) => r.uses_arduino)) b.add("arduino");
  if (doneRecipes.some((r) => r.difficulty === 3)) b.add("level3");
  if (repairs.some((r) => r.outcome === "fixed")) {
    b.add("first_repair");
    b.add("saved_device");
  }
  if (repairs.some((r) => r.outcome === "salvaged")) {
    b.add("saved_device");
    b.add("salvager");
  }
  return b;
}

export const BADGES: { id: BadgeId; icon: string }[] = [
  { id: "first_circuit", icon: "💡" },
  { id: "first_repair", icon: "🔧" },
  { id: "saved_device", icon: "♻️" },
  { id: "salvager", icon: "🧲" },
  { id: "arduino", icon: "🤖" },
  { id: "level3", icon: "🏆" },
];
