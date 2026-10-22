/**
 * Resistor colour-code decoder. Claude only names the band colours; all arithmetic happens here.
 * 4-band: digit, digit, multiplier, tolerance. 5-band: digit, digit, digit, multiplier, tolerance.
 */
export const BAND_COLORS = [
  "black",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
  "grey",
  "white",
  "gold",
  "silver",
] as const;
export type BandColor = (typeof BAND_COLORS)[number];

const DIGIT: Partial<Record<BandColor, number>> = {
  black: 0,
  brown: 1,
  red: 2,
  orange: 3,
  yellow: 4,
  green: 5,
  blue: 6,
  violet: 7,
  grey: 8,
  white: 9,
};
const MULTIPLIER: Partial<Record<BandColor, number>> = {
  black: 1,
  brown: 10,
  red: 100,
  orange: 1e3,
  yellow: 1e4,
  green: 1e5,
  blue: 1e6,
  violet: 1e7,
  gold: 0.1,
  silver: 0.01,
};
const TOLERANCE: Partial<Record<BandColor, number>> = {
  brown: 1,
  red: 2,
  green: 0.5,
  blue: 0.25,
  violet: 0.1,
  grey: 0.05,
  gold: 5,
  silver: 10,
};

const ALIASES: Record<string, BandColor> = {
  gray: "grey",
  purple: "violet",
  beige: "gold",
};

export function normalizeColor(c: string): BandColor | null {
  const s = c.trim().toLowerCase();
  const v = (ALIASES[s] ?? s) as BandColor;
  return (BAND_COLORS as readonly string[]).includes(v) ? v : null;
}

export interface DecodedResistor {
  ohms: number;
  tolerance: number | null;
  bands: BandColor[];
}

/** Decode bands read left→right (tolerance band last). Returns null if the sequence is impossible. */
export function decodeBands(input: string[]): DecodedResistor | null {
  const bands = input.map(normalizeColor);
  if (bands.some((b) => b === null)) return null;
  const b = bands as BandColor[];
  let digits: BandColor[];
  let mult: BandColor;
  let tol: BandColor | undefined;
  if (b.length === 3) {
    [digits, mult] = [b.slice(0, 2), b[2]]; // no tolerance band = ±20%
  } else if (b.length === 4) {
    [digits, mult, tol] = [b.slice(0, 2), b[2], b[3]];
  } else if (b.length === 5) {
    [digits, mult, tol] = [b.slice(0, 3), b[3], b[4]];
  } else {
    return null;
  }
  if (digits.some((d) => DIGIT[d] === undefined)) return null;
  const m = MULTIPLIER[mult];
  if (m === undefined) return null;
  if (tol !== undefined && TOLERANCE[tol] === undefined) return null;
  const base = digits.reduce((acc, d) => acc * 10 + DIGIT[d]!, 0);
  // Round away floating-point noise from gold/silver multipliers.
  const ohms = Number((base * m).toPrecision(6));
  return { ohms, tolerance: tol ? TOLERANCE[tol]! : 20, bands: b };
}

/** E12 series: the values found in every hobby kit. */
const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

export function isStandardValue(ohms: number): boolean {
  if (ohms <= 0) return false;
  const exp = Math.floor(Math.log10(ohms));
  const mant = Number((ohms / 10 ** exp).toPrecision(3));
  return E12.some((v) => Math.abs(v - mant) < 1e-9);
}

/**
 * Bands are often read from the wrong end. Try both directions and prefer the reading that gives
 * a standard E12 value with a real tolerance band at the end.
 */
export function decodeEitherWay(bands: string[]): { result: DecodedResistor; confident: boolean } | null {
  const fwd = decodeBands(bands);
  const rev = decodeBands([...bands].reverse());
  const score = (d: DecodedResistor | null) => (d ? (isStandardValue(d.ohms) ? 2 : 1) : 0);
  const sf = score(fwd);
  const sr = score(rev);
  if (!fwd && !rev) return null;
  if (sf >= sr) return { result: fwd!, confident: sf === 2 && sr < 2 };
  return { result: rev!, confident: sr === 2 && sf < 2 };
}
