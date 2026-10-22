import { compareWithSchematic, KINDS } from "./breadboard";
import { allSlots, resolveAccept, substitutions } from "./data";
import type { DeviceProfile, Effects, Recipe } from "./schemas";

/** Cross-reference checks that zod can't express. Returns a list of problems (empty = OK). */
export function validateRecipe(r: Recipe): string[] {
  const errs: string[] = [];
  const slots = allSlots(r);
  const slotIds = new Set<string>();
  for (const s of slots) {
    if (slotIds.has(s.id)) errs.push(`duplicate slot id ${s.id}`);
    slotIds.add(s.id);
    if (s.accept.group && !substitutions.groups[s.accept.group]) errs.push(`slot ${s.id}: unknown group ${s.accept.group}`);
    try {
      resolveAccept(s.accept);
    } catch (e) {
      errs.push(`slot ${s.id}: ${(e as Error).message}`);
    }
  }

  // Every slot except the breadboard must be used in the layout, with no more components than its quantity.
  const used = new Map<string, number>();
  for (const c of r.layout.components) {
    if (c.slot) {
      if (!slotIds.has(c.slot)) errs.push(`component ${c.ref}: unknown slot ${c.slot}`);
      used.set(c.slot, (used.get(c.slot) ?? 0) + 1);
    }
  }
  for (const s of slots) {
    if (s.part_type === "breadboard") continue;
    const n = used.get(s.id) ?? 0;
    if (n !== s.quantity) errs.push(`slot ${s.id}: quantity ${s.quantity} but layout uses ${n}`);
  }
  if (!r.slots.some((s) => s.part_type === "breadboard")) errs.push("no breadboard slot");

  // Every component and wire is placed in exactly one step.
  const items = [...r.layout.components.map((c) => c.ref), ...r.layout.wires.map((w) => w.id)];
  const placed = new Map<string, number>();
  for (const s of r.steps) for (const a of s.add) placed.set(a, (placed.get(a) ?? 0) + 1);
  for (const id of items) {
    const n = placed.get(id) ?? 0;
    if (n !== 1) errs.push(`${id} is placed in ${n} steps (must be exactly 1)`);
  }
  for (const id of placed.keys()) if (!items.includes(id)) errs.push(`step adds unknown item ${id}`);

  // Electrical: the breadboard layout must build exactly the schematic.
  errs.push(...compareWithSchematic(r.layout, r.schematic));

  // Arduino recipes have code and an Arduino; battery recipes have a battery.
  const kinds = new Set(r.layout.components.map((c) => c.kind));
  if (r.uses_arduino !== kinds.has("arduino")) errs.push("uses_arduino does not match the layout");
  if (r.uses_arduino && !r.code) errs.push("Arduino recipe without code");
  if (!r.uses_arduino && !kinds.has("battery")) errs.push("non-Arduino recipe without a battery");

  // Every LED must have a resistor on one of its non-supply nets.
  errs.push(...checkLedResistors(r));
  return errs;
}

const SUPPLY = /^(BAT\.|ARD\.(5V|3V3|GND))/;

function checkLedResistors(r: Recipe): string[] {
  const errs: string[] = [];
  const kindOf = new Map(r.layout.components.map((c) => [c.ref, c.kind]));
  const netsOf = (ref: string) => r.schematic.nets.filter((n) => n.pins.some((p) => p.startsWith(`${ref}.`)));
  // Follow the series chain through diodes (R → D → LED is fine), stopping at supply nets.
  const reachesResistor = (ref: string, seen: Set<string>): boolean =>
    netsOf(ref).some((n) => {
      if (n.pins.some((p) => SUPPLY.test(p))) return false;
      const others = n.pins.map((p) => p.split(".")[0]).filter((x) => x !== ref && !seen.has(x));
      if (others.some((x) => kindOf.get(x) === "resistor")) return true;
      return others.some((x) => kindOf.get(x) === "diode" && reachesResistor(x, new Set([...seen, ref])));
    });
  for (const led of r.layout.components.filter((c) => c.kind === "led")) {
    if (!reachesResistor(led.ref, new Set())) errs.push(`${led.ref} has no series resistor`);
  }
  return errs;
}

export function validateDevice(d: DeviceProfile): string[] {
  const errs: string[] = [];
  const causeIds = new Set(d.causes.map((c) => c.id));
  const checkEffects = (where: string, e: Effects) => {
    for (const k of Object.keys(e)) if (!causeIds.has(k)) errs.push(`${where}: unknown cause ${k}`);
  };
  const answerIds = new Map(d.questions.map((q) => [q.id, new Set(q.answers.map((a) => a.id))]));
  const checkAskIf = (where: string, askIf?: Record<string, string[]>) => {
    for (const [qid, answers] of Object.entries(askIf ?? {})) {
      const known = answerIds.get(qid);
      if (!known) errs.push(`${where}: ask_if refers to unknown question ${qid}`);
      else for (const a of answers) if (!known.has(a)) errs.push(`${where}: ask_if ${qid} has unknown answer ${a}`);
    }
  };
  const seen = new Set<string>();
  for (const q of d.questions) {
    if (seen.has(q.id)) errs.push(`duplicate question ${q.id}`);
    seen.add(q.id);
    for (const a of q.answers) checkEffects(`question ${q.id}/${a.id}`, a.effects);
    checkAskIf(`question ${q.id}`, q.ask_if);
  }
  for (const t of d.tests) {
    for (const o of t.outcomes) checkEffects(`test ${t.id}/${o.id}`, o.effects);
    checkAskIf(`test ${t.id}`, t.ask_if);
    if (t.kind === "multimeter_battery") {
      const ids = t.outcomes.map((o) => o.id).sort().join();
      if (ids !== "low,ok,skip") errs.push(`test ${t.id}: multimeter outcomes must be ok/low/skip`);
      if (!t.battery_options.length) errs.push(`test ${t.id}: needs battery_options`);
    }
  }
  for (const v of d.visual_checks) checkEffects(`visual ${v.defect}`, v.effects);
  if (!d.causes.some((c) => c.unfixable)) errs.push("needs at least one unfixable cause (leads to salvage)");
  for (const c of d.causes) {
    if (c.fix.needs_soldering && !c.fix.safety.length) errs.push(`cause ${c.id}: soldering fix without safety notes`);
  }
  return errs;
}

export { KINDS };
