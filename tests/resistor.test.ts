import { describe, expect, it } from "vitest";
import { decodeBands, decodeEitherWay, isStandardValue } from "@/lib/resistor";

describe("resistor colour decoder", () => {
  it.each([
    [["brown", "black", "red", "gold"], 1000, 5],
    [["red", "red", "brown", "gold"], 220, 5],
    [["orange", "orange", "brown", "gold"], 330, 5],
    [["yellow", "violet", "red", "gold"], 4700, 5],
    [["brown", "black", "orange", "gold"], 10000, 5],
    [["brown", "black", "yellow", "silver"], 100000, 10],
    [["yellow", "violet", "brown", "gold"], 470, 5],
    [["green", "blue", "black", "black", "brown"], 560, 1],
    [["brown", "black", "black", "red", "brown"], 10000, 1],
    [["red", "red", "gold", "gold"], 2.2, 5],
    [["brown", "black", "silver", "gold"], 0.1, 5],
    [["brown", "black", "red"], 1000, 20],
  ])("%j → %dΩ ±%d%%", (bands, ohms, tol) => {
    const d = decodeBands(bands as string[]);
    expect(d?.ohms).toBe(ohms);
    expect(d?.tolerance).toBe(tol);
  });

  it("accepts gray/purple spellings", () => {
    expect(decodeBands(["gray", "red", "red", "gold"])?.ohms).toBe(8200);
    expect(decodeBands(["yellow", "purple", "orange", "gold"])?.ohms).toBe(47000);
  });

  it("rejects impossible sequences", () => {
    expect(decodeBands(["gold", "red", "red", "brown"])).toBeNull(); // gold can't be a digit
    expect(decodeBands(["red", "red", "white", "gold"])).toBeNull(); // white isn't a multiplier
    expect(decodeBands(["red", "red", "red", "orange"])).toBeNull(); // orange isn't a tolerance
    expect(decodeBands(["red", "pink", "red", "gold"])).toBeNull();
    expect(decodeBands(["red", "red"])).toBeNull();
  });

  it("decodes resistors read from the wrong end", () => {
    const r = decodeEitherWay(["gold", "red", "black", "brown"]);
    expect(r?.result.ohms).toBe(1000);
    expect(r?.confident).toBe(true);
  });

  it("is not confident when both directions give a standard value", () => {
    const r = decodeEitherWay(["brown", "black", "black", "black", "brown"]); // reads 100Ω both ways
    expect(r?.result.ohms).toBe(100);
    expect(r?.confident).toBe(false);
  });

  it("reads real 5-band resistors from either end", () => {
    // Reported from the team's kit, read from the tolerance end first.
    const a = decodeEitherWay(["brown", "orange", "black", "black", "brown"]);
    expect(a?.result.ohms).toBe(100000); // 100kΩ, not 130Ω
    expect(a?.confident).toBe(true);
    // Yellow misread as green: neither direction is standard, so it must not pick 1GΩ, and stays "?" for the user.
    const b = decodeEitherWay(["brown", "black", "black", "violet", "green"]);
    expect(b?.result.ohms).toBe(570);
    expect(b?.confident).toBe(false);
    expect(decodeEitherWay(["brown", "black", "black", "violet", "yellow"])?.result.ohms).toBe(470);
  });

  it("knows E12 values", () => {
    expect(isStandardValue(4700)).toBe(true);
    expect(isStandardValue(220)).toBe(true);
    expect(isStandardValue(1100)).toBe(false);
  });
});
