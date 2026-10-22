import type { Spec } from "./schemas";

const PREFIX: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  μ: 1e-6,
  m: 1e-3,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  R: 1,
  r: 1,
};

/** Parse "4.7k", "4k7", "220R", "10µF", "100uF", "1M" → number in base units. Returns null if unparseable. */
export function parseValue(input: string): number | null {
  const s = input.trim().replace(/\s+/g, "").replace(/(Ω|ohms?|F|V)$/i, "");
  // "4k7" style: the prefix letter replaces the decimal point
  let m = /^(\d+)([pnuµμmkKMRr])(\d+)$/.exec(s);
  if (m) return Number(`${m[1]}.${m[3]}`) * PREFIX[m[2]];
  m = /^(\d+(?:\.\d+)?)([pnuµμmkKMRr]?)$/.exec(s);
  if (m) return Number(m[1]) * (m[2] ? PREFIX[m[2]] : 1);
  return null;
}

/** Read a ceramic capacitor code like "104" (pF): 10 × 10^4 pF = 100nF. */
export function parseCapCode(code: string): number | null {
  const m = /^(\d)(\d)(\d)$/.exec(code.trim());
  if (!m) return null;
  return Number(m[1] + m[2]) * 10 ** Number(m[3]) * 1e-12;
}

function trim(n: number): string {
  return Number(n.toPrecision(3)).toString();
}

export function formatOhms(ohms: number): string {
  if (ohms >= 1e6) return `${trim(ohms / 1e6)}MΩ`;
  if (ohms >= 1e3) return `${trim(ohms / 1e3)}kΩ`;
  return `${trim(ohms)}Ω`;
}

export function formatFarads(f: number): string {
  if (f >= 1e-6) return `${trim(f / 1e-6)}µF`;
  if (f >= 1e-9) return `${trim(f / 1e-9)}nF`;
  return `${trim(f / 1e-12)}pF`;
}

/** Short human label for a part spec, e.g. "220Ω", "100µF 16V", "BC547", "red". */
export function formatSpec(spec: Spec): string {
  const bits: string[] = [];
  if (spec.part_number) bits.push(spec.part_number);
  if (spec.ohms !== undefined) bits.push(formatOhms(spec.ohms));
  if (spec.farads !== undefined) bits.push(formatFarads(spec.farads));
  if (spec.volts !== undefined) bits.push(`${trim(spec.volts)}V`);
  if (spec.color) bits.push(spec.color);
  if (spec.variant && !spec.part_number) bits.push(spec.variant);
  return bits.join(" ");
}

/** Normalise a part marking: uppercase, no spaces/dashes ("bc 547b" → "BC547B"). */
export function normPartNumber(s: string): string {
  return s.toUpperCase().replace(/[\s\-_]/g, "");
}
