import { describe, expect, it } from "vitest";
import { cleanPartNumber, parseBattery, parseCapacitor, parsePot } from "@/lib/markings";

describe("marking parser", () => {
  it("reads electrolytic capacitors", () => {
    const s = parseCapacitor(["100µF", "16V"], "electrolytic");
    expect(s.farads).toBeCloseTo(100e-6);
    expect(s.volts).toBe(16);
    expect(s.variant).toBe("electrolytic");
    expect(parseCapacitor(["470uF 25V"], "unknown").farads).toBeCloseTo(470e-6);
    expect(parseCapacitor(["47 MFD"], "unknown").farads).toBeCloseTo(47e-6);
  });
  it("reads ceramic codes", () => {
    const s = parseCapacitor(["104"], "ceramic");
    expect(s.farads).toBeCloseTo(100e-9);
    expect(parseCapacitor(["10nF"], "unknown").variant).toBe("ceramic");
  });
  it("reads pots", () => {
    expect(parsePot(["B10K"]).ohms).toBe(10000);
    expect(parsePot(["103"]).ohms).toBe(10000);
    expect(parsePot(["A100K"]).ohms).toBe(100000);
  });
  it("reads batteries", () => {
    expect(parseBattery(["9V"])).toEqual({ volts: 9, variant: "9v" });
    expect(parseBattery(["CR2032", "3V"])).toEqual({ volts: 3, variant: "cr2032" });
    expect(parseBattery(["A23", "12V"]).volts).toBe(12);
  });
  it("cleans part numbers", () => {
    expect(cleanPartNumber("bc 547b")).toBe("BC547B");
    expect(cleanPartNumber(null)).toBeUndefined();
  });
});
