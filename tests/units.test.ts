import { describe, expect, it } from "vitest";
import { formatFarads, formatOhms, formatSpec, parseCapCode, parseValue } from "@/lib/units";

describe("units", () => {
  it("parses values", () => {
    expect(parseValue("4.7k")).toBeCloseTo(4700);
    expect(parseValue("4k7")).toBeCloseTo(4700);
    expect(parseValue("220R")).toBe(220);
    expect(parseValue("220 Ω")).toBe(220);
    expect(parseValue("100uF")).toBeCloseTo(100e-6);
    expect(parseValue("10µF")).toBeCloseTo(10e-6);
    expect(parseValue("1M")).toBe(1e6);
    expect(parseValue("abc")).toBeNull();
  });
  it("reads ceramic codes", () => {
    expect(parseCapCode("104")).toBeCloseTo(100e-9);
    expect(parseCapCode("103")).toBeCloseTo(10e-9);
  });
  it("formats", () => {
    expect(formatOhms(220)).toBe("220Ω");
    expect(formatOhms(4700)).toBe("4.7kΩ");
    expect(formatOhms(1e6)).toBe("1MΩ");
    expect(formatFarads(1e-4)).toBe("100µF");
    expect(formatFarads(1e-8)).toBe("10nF");
    expect(formatSpec({ farads: 1e-4, volts: 16 })).toBe("100µF 16V");
  });
});
