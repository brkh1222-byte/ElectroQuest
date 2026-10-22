import { catalogue, resolveAccept, substitutions } from "./data";
import type { Accept, InventoryItem, Recipe, Slot, Spec } from "./schemas";
import { normPartNumber } from "./units";

/**
 * Recipe ↔ inventory matching. Pure code, no AI.
 * Each inventory item is split into units (quantity 3 → 3 units); each slot needs `quantity` units;
 * a unit can fill only one slot. We solve it as bipartite matching (augmenting paths), so a value that
 * fits two slots is never "used up" on the wrong one.
 */

const inRange = (v: number | undefined, r?: { min: number; max: number }) =>
  r === undefined || (v !== undefined && v >= r.min * (1 - 1e-9) && v <= r.max * (1 + 1e-9));

function partNumberMatches(pn: string | undefined, allowed: string[]): boolean {
  if (!pn) return false;
  const n = normPartNumber(pn);
  // "BC547B" and "NE555P" are the same parts as "BC547" / "NE555".
  return allowed.some((a) => n.startsWith(normPartNumber(a)));
}

export function specFits(partType: string, spec: Spec, accept: Accept): boolean {
  const a = resolveAccept(accept);
  if (!inRange(spec.ohms, a.ohms)) return false;
  if (!inRange(spec.farads, a.farads)) return false;
  if (!inRange(spec.volts, a.volts)) return false;
  if (a.colors && !(spec.color && a.colors.includes(spec.color))) return false;
  if (a.variants && !(spec.variant && a.variants.includes(spec.variant))) return false;
  if (a.part_numbers && !partNumberMatches(spec.part_number, a.part_numbers)) return false;
  if (a.group) {
    const g = substitutions.groups[a.group];
    if (!g || !partNumberMatches(spec.part_number, g.part_numbers)) return false;
  }
  // An infrared LED is invisible: it only fills a slot that explicitly asks for one.
  if (partType === "led" && spec.color === "infrared" && !a.colors?.includes("infrared")) return false;
  return true;
}

export function itemFits(item: InventoryItem, slot: Slot): boolean {
  return item.part_type === slot.part_type && specFits(item.part_type, item.spec, slot.accept);
}

/** How far an item's value is from the slot's preferred value (lower = better). */
function distance(spec: Spec, pref: Spec): number {
  const logd = (a?: number, b?: number) => (a && b ? Math.abs(Math.log10(a / b)) : 0);
  const colour = pref.color && spec.color !== pref.color ? 0.5 : 0;
  return logd(spec.ohms, pref.ohms) + logd(spec.farads, pref.farads) + logd(spec.volts, pref.volts) + colour;
}

export interface Unit {
  itemId: string;
  unit: number;
}
export interface Fill {
  slotId: string;
  slotUnit: number;
  item: Unit;
}
export interface Missing {
  slot: Slot;
  count: number;
  price_mnt: number;
  shop: string;
}
export type MatchStatus = "ready" | "missing1" | "more";
export interface MatchResult {
  recipe: Recipe;
  status: MatchStatus;
  fills: Fill[];
  optionalFills: Fill[];
  missing: Missing[];
  missingCount: number;
  partsUsed: number;
}

interface SlotUnit {
  slot: Slot;
  idx: number;
  candidates: Unit[];
}

function buildSlotUnits(slots: Slot[], items: InventoryItem[]): SlotUnit[] {
  const out: SlotUnit[] = [];
  for (const slot of slots) {
    const cands = items
      .filter((it) => itemFits(it, slot))
      .sort((a, b) => distance(a.spec, slot.preferred) - distance(b.spec, slot.preferred))
      .flatMap((it) => Array.from({ length: it.quantity }, (_, u) => ({ itemId: it.id, unit: u })));
    for (let i = 0; i < slot.quantity; i++) out.push({ slot, idx: i, candidates: cands });
  }
  // Most constrained first: fewer options → assign earlier.
  return out.sort((a, b) => a.candidates.length - b.candidates.length);
}

const unitKey = (u: Unit) => `${u.itemId}#${u.unit}`;

/** Kuhn's augmenting-path matching. `owner` maps unit → index in `sus`. Mutates `owner`. */
function augment(sus: SlotUnit[], owner: Map<string, number>, blocked: Set<string>): Set<number> {
  const matched = new Set<number>();
  const tryAssign = (i: number, seen: Set<string>): boolean => {
    for (const u of sus[i].candidates) {
      const k = unitKey(u);
      if (seen.has(k) || blocked.has(k)) continue;
      seen.add(k);
      const cur = owner.get(k);
      if (cur === undefined || tryAssign(cur, seen)) {
        owner.set(k, i);
        return true;
      }
    }
    return false;
  };
  sus.forEach((_, i) => {
    if (tryAssign(i, new Set())) matched.add(i);
  });
  return matched;
}

function toFills(sus: SlotUnit[], owner: Map<string, number>): Fill[] {
  const fills: Fill[] = [];
  for (const [k, i] of owner) {
    const [itemId, unit] = k.split("#");
    fills.push({ slotId: sus[i].slot.id, slotUnit: sus[i].idx, item: { itemId, unit: Number(unit) } });
  }
  return fills;
}

export function matchRecipe(recipe: Recipe, inventory: InventoryItem[]): MatchResult {
  const required = buildSlotUnits(recipe.slots, inventory);
  const owner = new Map<string, number>();
  const matched = augment(required, owner, new Set());
  const fills = toFills(required, owner);

  // Optional slots only get what's left over.
  const optional = buildSlotUnits(recipe.optional_slots, inventory);
  const optOwner = new Map<string, number>();
  augment(optional, optOwner, new Set(owner.keys()));
  const optionalFills = toFills(optional, optOwner);

  const missingBySlot = new Map<string, number>();
  required.forEach((su, i) => {
    if (!matched.has(i)) missingBySlot.set(su.slot.id, (missingBySlot.get(su.slot.id) ?? 0) + 1);
  });
  const missing: Missing[] = [...missingBySlot].map(([id, count]) => {
    const slot = recipe.slots.find((s) => s.id === id)!;
    const part = catalogue.parts[slot.part_type];
    return { slot, count, price_mnt: (part?.price_mnt ?? 0) * count, shop: part?.shop ?? "electronics" };
  });
  const missingCount = missing.reduce((a, m) => a + m.count, 0);
  return {
    recipe,
    status: missingCount === 0 ? "ready" : missingCount === 1 ? "missing1" : "more",
    fills,
    optionalFills,
    missing,
    missingCount,
    partsUsed: fills.length + optionalFills.length,
  };
}

export function matchAll(recipes: Recipe[], inventory: InventoryItem[]) {
  const results = recipes.map((r) => matchRecipe(r, inventory));
  const order = (a: MatchResult, b: MatchResult) =>
    a.recipe.difficulty - b.recipe.difficulty || b.partsUsed - a.partsUsed || a.recipe.id.localeCompare(b.recipe.id);
  return {
    ready: results.filter((r) => r.status === "ready").sort(order),
    missing1: results.filter((r) => r.status === "missing1").sort(order),
    hidden: results.filter((r) => r.status === "more"),
  };
}
