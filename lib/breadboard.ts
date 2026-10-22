import type { ComponentKind, Layout, LayoutComponent, Schematic } from "./schemas";

/**
 * Half-size breadboard model: columns 1..30, rows a–e and f–j (each column's half is connected),
 * and four power rails that run the full length: t+ / t- on top, b+ / b- on the bottom.
 * Off-board parts (battery, Arduino, servo, motor) expose terminals named "REF.pin".
 */
export const COLS = 30;
export const ROWS_TOP = ["a", "b", "c", "d", "e"] as const;
export const ROWS_BOTTOM = ["f", "g", "h", "i", "j"] as const;
export const RAILS = ["t-", "t+", "b+", "b-"] as const;

export interface KindDef {
  /** Physical legs that go into holes (empty for off-board parts). */
  pins: string[];
  /** Pins that appear in the netlist. Defaults to `pins`. */
  logical?: string[];
  /** Pins joined inside the part (tactile button legs). */
  internal?: [string, string][];
  offboard?: boolean;
  /** Off-board terminals. */
  terminals?: string[];
}

const ARDUINO_PINS = [
  "5V",
  "3V3",
  "GND",
  ...Array.from({ length: 12 }, (_, i) => `D${i + 2}`),
  ...Array.from({ length: 6 }, (_, i) => `A${i}`),
];

export const KINDS: Record<ComponentKind, KindDef> = {
  resistor: { pins: ["1", "2"] },
  led: { pins: ["A", "K"] },
  diode: { pins: ["A", "K"] },
  cap_electrolytic: { pins: ["+", "-"] },
  cap_ceramic: { pins: ["1", "2"] },
  npn: { pins: ["C", "B", "E"] },
  ic_dip8: { pins: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  button: { pins: ["1", "1b", "2", "2b"], logical: ["1", "2"], internal: [["1", "1b"], ["2", "2b"]] },
  buzzer: { pins: ["+", "-"] },
  potentiometer: { pins: ["1", "W", "3"] },
  ldr: { pins: ["1", "2"] },
  ultrasonic: { pins: ["VCC", "TRIG", "ECHO", "GND"] },
  touch_plate: { pins: ["A", "B"] },
  battery: { pins: [], offboard: true, terminals: ["+", "-"] },
  arduino: { pins: [], offboard: true, terminals: ARDUINO_PINS },
  servo: { pins: [], offboard: true, terminals: ["SIG", "V+", "GND"] },
  dc_motor: { pins: [], offboard: true, terminals: ["1", "2"] },
};

export interface Hole {
  kind: "main" | "rail";
  row: string; // "a".."j" or rail name
  col: number;
}

export function parseHole(id: string): Hole | null {
  let m = /^([a-j])([0-9]{1,2})$/.exec(id);
  if (m) {
    const col = Number(m[2]);
    return col >= 1 && col <= COLS ? { kind: "main", row: m[1], col } : null;
  }
  m = /^([tb][+-])([0-9]{1,2})$/.exec(id);
  if (m) {
    const col = Number(m[2]);
    return col >= 1 && col <= COLS ? { kind: "rail", row: m[1], col } : null;
  }
  return null;
}

/** The electrical node a hole belongs to before any wires are added. */
export function holeNode(id: string): string | null {
  const h = parseHole(id);
  if (!h) return null;
  if (h.kind === "rail") return `rail:${h.row}`;
  return (ROWS_TOP as readonly string[]).includes(h.row) ? `col:${h.col}:top` : `col:${h.col}:bottom`;
}

class UnionFind {
  private parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

function offboardRefs(layout: Layout): Map<string, LayoutComponent> {
  return new Map(layout.components.filter((c) => KINDS[c.kind].offboard).map((c) => [c.ref, c]));
}

/** Resolve any endpoint (hole or "REF.pin" terminal) to a node id, or null if invalid. */
function endpointNode(layout: Layout, ep: string): string | null {
  const hn = holeNode(ep);
  if (hn) return hn;
  const dot = ep.indexOf(".");
  if (dot < 0) return null;
  const ref = ep.slice(0, dot);
  const pin = ep.slice(dot + 1);
  const comp = offboardRefs(layout).get(ref);
  if (!comp || !KINDS[comp.kind].terminals?.includes(pin)) return null;
  return `term:${ep}`;
}

export interface LayoutCheck {
  errors: string[];
  /** Computed nets: sets of "REF.pin", sorted, only nets with ≥2 pins. */
  nets: string[][];
  floating: string[];
}

export function analyzeLayout(layout: Layout): LayoutCheck {
  const errors: string[] = [];
  const uf = new UnionFind();
  const usedHoles = new Map<string, string>();
  const claimHole = (hole: string, by: string) => {
    if (!parseHole(hole)) return;
    const prev = usedHoles.get(hole);
    if (prev) errors.push(`hole ${hole} used by both ${prev} and ${by}`);
    else usedHoles.set(hole, by);
  };

  const refs = new Set<string>();
  const logicalPins: { name: string; node: string }[] = [];

  for (const c of layout.components) {
    if (refs.has(c.ref)) errors.push(`duplicate ref ${c.ref}`);
    refs.add(c.ref);
    const def = KINDS[c.kind];
    if (def.offboard) {
      if (Object.keys(c.pins).length) errors.push(`${c.ref}: off-board parts take no holes`);
      continue;
    }
    const placed = Object.keys(c.pins).sort();
    const expected = [...def.pins].sort();
    if (placed.join() !== expected.join()) {
      errors.push(`${c.ref}: pins ${placed.join(",")} but ${c.kind} needs ${expected.join(",")}`);
      continue;
    }
    for (const [pin, hole] of Object.entries(c.pins)) {
      if (!parseHole(hole)) errors.push(`${c.ref}.${pin}: bad hole "${hole}"`);
      claimHole(hole, `${c.ref}.${pin}`);
    }
    if (c.kind === "ic_dip8") checkDip8(c, errors);
    for (const [a, b] of def.internal ?? []) uf.union(holeNode(c.pins[a])!, holeNode(c.pins[b])!);
    for (const pin of def.logical ?? def.pins) {
      const n = holeNode(c.pins[pin]);
      if (n) logicalPins.push({ name: `${c.ref}.${pin}`, node: n });
    }
  }

  const touchedTerminals = new Set<string>();
  for (const w of layout.wires) {
    const a = endpointNode(layout, w.from);
    const b = endpointNode(layout, w.to);
    if (!a) errors.push(`wire ${w.id}: bad endpoint "${w.from}"`);
    if (!b) errors.push(`wire ${w.id}: bad endpoint "${w.to}"`);
    if (!a || !b) continue;
    claimHole(w.from, `wire ${w.id}`);
    claimHole(w.to, `wire ${w.id}`);
    uf.union(a, b);
    for (const ep of [w.from, w.to]) if (!parseHole(ep)) touchedTerminals.add(ep);
  }
  for (const t of touchedTerminals) logicalPins.push({ name: t, node: `term:${t}` });

  const groups = new Map<string, string[]>();
  for (const p of logicalPins) {
    const root = uf.find(p.node);
    groups.set(root, [...(groups.get(root) ?? []), p.name]);
  }
  const nets: string[][] = [];
  const floating: string[] = [];
  for (const g of groups.values()) {
    if (g.length >= 2) nets.push([...g].sort());
    else floating.push(g[0]);
  }
  nets.sort((x, y) => x[0].localeCompare(y[0]));
  return { errors, nets, floating };
}

function checkDip8(c: LayoutComponent, errors: string[]) {
  const h1 = parseHole(c.pins["1"]);
  if (!h1 || h1.kind !== "main" || h1.row !== "e") {
    errors.push(`${c.ref}: DIP-8 pin 1 must be in row e`);
    return;
  }
  const want: Record<string, string> = {};
  for (let i = 0; i < 4; i++) {
    want[String(i + 1)] = `e${h1.col + i}`;
    want[String(8 - i)] = `f${h1.col + i}`;
  }
  for (const [pin, hole] of Object.entries(want)) {
    if (c.pins[pin] !== hole) errors.push(`${c.ref}: DIP-8 pin ${pin} should be ${hole} (straddling the gap), got ${c.pins[pin]}`);
  }
}

/** Compare a layout's real connectivity with the schematic. Returns human-readable differences. */
export function compareWithSchematic(layout: Layout, schematic: Schematic): string[] {
  const { errors, nets, floating } = analyzeLayout(layout);
  const out = [...errors];
  for (const f of floating) out.push(`floating pin ${f} (connected to nothing)`);
  const key = (pins: string[]) => [...pins].sort().join(" ");
  const have = new Set(nets.map(key));
  const want = new Set(schematic.nets.map((n) => key(n.pins)));
  for (const n of schematic.nets) if (!have.has(key(n.pins))) out.push(`schematic net "${n.name}" [${key(n.pins)}] is not built by the layout`);
  for (const n of nets) if (!want.has(key(n))) out.push(`layout builds net [${key(n)}] that is not in the schematic`);
  return out;
}
