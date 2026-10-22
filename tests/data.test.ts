import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { devices, recipes, resolveAccept, substitutions } from "@/lib/data";
import { DeviceProfile, Recipe } from "@/lib/schemas";
import { validateDevice, validateRecipe } from "@/lib/validate";
import { analyzeLayout } from "@/lib/breadboard";

const dir = (d: string) => fs.readdirSync(path.join(__dirname, "..", d)).filter((f) => f.endsWith(".json"));

describe("recipe files", () => {
  it("has at least 20 recipes with unique ids", () => {
    expect(recipes.length).toBeGreaterThanOrEqual(20);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(recipes.length);
  });

  it("mixes Arduino and non-Arduino projects at every difficulty", () => {
    expect(recipes.filter((r) => r.uses_arduino).length).toBeGreaterThanOrEqual(6);
    expect(recipes.filter((r) => !r.uses_arduino).length).toBeGreaterThanOrEqual(6);
    for (const d of [1, 2, 3]) expect(recipes.some((r) => r.difficulty === d)).toBe(true);
  });

  for (const f of dir("data/recipes")) {
    it(`${f} parses and passes every check`, () => {
      const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/recipes", f), "utf8"));
      const r = Recipe.parse(raw);
      expect(`${r.id}.json`).toBe(f);
      expect(validateRecipe(r)).toEqual([]);
    });
  }

  it("is low voltage only", () => {
    for (const r of recipes) expect(r.supply_v).toBeLessThanOrEqual(9);
  });

  it("LED resistor presets keep LED current under 25 mA at the recipe's max supply", () => {
    const VF_MIN = 1.8; // red LED, the worst case
    for (const r of recipes) {
      const battery = r.slots.find((s) => s.part_type === "battery");
      const vmax = battery ? resolveAccept(battery.accept).volts!.max : 5;
      for (const s of r.slots.filter((s) => s.id.startsWith("r_led"))) {
        const ohms = resolveAccept(s.accept).ohms!;
        const mA = ((vmax - VF_MIN) / ohms.min) * 1000;
        expect(mA, `${r.id}/${s.id}`).toBeLessThanOrEqual(25);
      }
    }
  });

  it("night light divider: transistor is off in room light and on in the dark", () => {
    const r = recipes.find((x) => x.id === "night-light")!;
    const top = resolveAccept(r.slots.find((s) => s.id === "r_top")!.accept).ohms!;
    const vbase = (ldr: number, rtop: number) => (9 * ldr) / (ldr + rtop);
    // Room light: LDR ≈ 2kΩ → base well below 0.6V for every accepted top resistor.
    expect(vbase(2000, top.min)).toBeLessThan(0.6);
    // Dark: LDR ≈ 500kΩ → base above 0.7V (transistor on) for every accepted top resistor.
    expect(vbase(500000, top.max)).toBeGreaterThan(0.7);
  });

  it("555 blinker blinks at a visible rate across the accepted values", () => {
    const r = recipes.find((x) => x.id === "blinker-555")!;
    const a = (id: string) => resolveAccept(r.slots.find((s) => s.id === id)!.accept);
    const f = (r1: number, r2: number, c: number) => 1.44 / ((r1 + 2 * r2) * c);
    expect(f(a("r1").ohms!.min, a("r2").ohms!.min, a("c_timing").farads!.min)).toBeLessThan(20);
    expect(f(a("r1").ohms!.max, a("r2").ohms!.max, a("c_timing").farads!.max)).toBeGreaterThan(0.1);
  });

  it("the layout checker catches a miswired circuit", () => {
    const r = structuredClone(recipes.find((x) => x.id === "led-basic")!);
    r.layout.components.find((c) => c.ref === "LED1")!.pins.K = "e7"; // LED cathode off the ground wire
    expect(validateRecipe(r).length).toBeGreaterThan(0);
    const dup = structuredClone(recipes.find((x) => x.id === "led-basic")!);
    dup.layout.components.find((c) => c.ref === "LED1")!.pins.A = "a5"; // a5 is already the resistor's hole
    expect(analyzeLayout(dup.layout).errors.join()).toMatch(/used by both/);
  });
});

describe("device files", () => {
  it("has the three MVP devices, all battery powered", () => {
    expect(devices.map((d) => d.id).sort()).toEqual(["game_controller", "garage_remote", "tv_remote"]);
    for (const d of devices) expect(d.power).toBe("battery");
  });

  for (const f of dir("data/devices")) {
    it(`${f} parses and passes every check`, () => {
      const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/devices", f), "utf8"));
      const d = DeviceProfile.parse(raw);
      expect(validateDevice(d)).toEqual([]);
    });
  }

  it("covers the required failures", () => {
    const ids = new Set(devices.flatMap((d) => d.causes.map((c) => c.id)));
    for (const c of ["dead_battery", "corroded_contacts", "worn_pads", "cracked_joint", "water_damage", "dead_ir_led", "lost_pairing", "joystick_drift", "usb_port"]) {
      expect(ids.has(c), c).toBe(true);
    }
  });

  it("references images that exist", () => {
    for (const d of devices) {
      for (const g of d.golden_references) expect(fs.existsSync(path.join(__dirname, "../public", g.image)), g.image).toBe(true);
      expect(fs.existsSync(path.join(__dirname, "../public", d.icon)), d.icon).toBe(true);
    }
  });
});

describe("substitutions", () => {
  it("has a pinout for every NPN part number", () => {
    const g = substitutions.groups.npn_small;
    for (const pn of g.part_numbers) expect(g.pinouts[pn], pn).toMatch(/^[CBE]-[CBE]-[CBE]$/);
  });
});
