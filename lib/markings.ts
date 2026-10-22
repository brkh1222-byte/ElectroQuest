import type { Spec } from "./schemas";
import { normPartNumber, parseCapCode, parseValue } from "./units";

/**
 * Turn printed text (transcribed by Claude) into values. All parsing and arithmetic happens here.
 */

const VOLTS = /(\d+(?:[.,]\d+)?)\s*V(?![A-Za-z])/i;

export function parseVolts(lines: string[]): number | undefined {
  for (const l of lines) {
    const m = VOLTS.exec(l);
    if (m) return Number(m[1].replace(",", "."));
  }
  return undefined;
}

/** "100µF 16V", "100uF", "47 mfd", "104" (ceramic code), "0.1" (µF on old caps) */
export function parseCapacitor(lines: string[], kind: string): Spec {
  const spec: Spec = {};
  const text = lines.join(" ");
  const f = /(\d+(?:[.,]\d+)?)\s*(p|n|u|µ|μ|m)?\s*(F|FD|MFD)\b/i.exec(text);
  if (f) {
    const n = Number(f[1].replace(",", "."));
    const prefix = (f[2] ?? "").toLowerCase();
    // "MFD" (old marking for µF) parses as prefix "M" + "FD"; a bare "mF" is millifarads.
    const mfd = /m\s*fd/i.test(f[0]);
    const mult = prefix === "p" ? 1e-12 : prefix === "n" ? 1e-9 : prefix === "m" && !mfd ? 1e-3 : 1e-6;
    spec.farads = n * mult;
  } else {
    const code = lines.map((l) => l.trim()).find((l) => /^\d{3}$/.test(l));
    if (code) spec.farads = parseCapCode(code) ?? undefined;
  }
  const v = parseVolts(lines);
  if (v) spec.volts = v;
  if (kind === "electrolytic" || kind === "ceramic") spec.variant = kind;
  else if (spec.farads !== undefined) spec.variant = spec.farads >= 1e-6 ? "electrolytic" : "ceramic";
  return spec;
}

/** Potentiometers: "B10K", "A100K", "10K", or the 3-digit code "103" (= 10kΩ). */
export function parsePot(lines: string[]): Spec {
  for (const l of lines) {
    const s = l.trim().toUpperCase();
    let m = /^(\d)(\d)(\d)$/.exec(s);
    if (m) return { ohms: Number(m[1] + m[2]) * 10 ** Number(m[3]) };
    m = /^[ABC]?(\d+(?:\.\d+)?[KM]?)$/.exec(s);
    if (m) {
      const v = parseValue(m[1]);
      if (v) return { ohms: v };
    }
  }
  return {};
}

export function parseBattery(lines: string[]): Spec {
  const text = lines.join(" ").toUpperCase();
  if (/CR\s?20(32|25|16)/.test(text)) return { volts: 3, variant: "cr2032" };
  if (/\b(A23|23A|27A|A27)\b/.test(text)) return { volts: 12, variant: "a23" };
  const v = parseVolts(lines);
  return v ? { volts: v, variant: v === 9 ? "9v" : undefined } : {};
}

export function cleanPartNumber(pn: string | null | undefined): string | undefined {
  if (!pn) return undefined;
  const n = normPartNumber(pn);
  return n.length >= 3 ? n : undefined;
}
