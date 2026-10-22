import { describe, expect, it } from "vitest";
import { matchAll, matchRecipe, specFits } from "@/lib/matcher";
import { recipeById, recipes } from "@/lib/data";
import type { InventoryItem, Spec } from "@/lib/schemas";

let n = 0;
const item = (part_type: string, spec: Spec = {}, quantity = 1): InventoryItem => ({
  id: `i${n++}`,
  part_type,
  spec,
  quantity,
  source: "manual",
  uncertain: false,
  refs: [],
  createdAt: 0,
});

const nightLightKit = () => [
  item("breadboard"),
  item("battery", { volts: 9, variant: "9v" }),
  item("ldr"),
  item("transistor", { part_number: "BC547B" }),
  item("resistor", { ohms: 100000 }),
  item("resistor", { ohms: 470 }),
  item("led", { color: "white" }),
];

describe("matcher", () => {
  it("builds the night light from a full kit", () => {
    const m = matchRecipe(recipeById("night-light")!, nightLightKit());
    expect(m.status).toBe("ready");
    expect(m.fills).toHaveLength(7);
  });

  it("reports exactly the one missing part", () => {
    const kit = nightLightKit().filter((i) => i.part_type !== "ldr");
    const m = matchRecipe(recipeById("night-light")!, kit);
    expect(m.status).toBe("missing1");
    expect(m.missing).toHaveLength(1);
    expect(m.missing[0].slot.part_type).toBe("ldr");
    expect(m.missing[0].price_mnt).toBeGreaterThan(0);
  });

  it("never lets one part fill two slots", () => {
    // Only one resistor, but the night light needs two.
    const kit = nightLightKit().filter((i) => !(i.part_type === "resistor" && i.spec.ohms === 470));
    const m = matchRecipe(recipeById("night-light")!, kit);
    const used = m.fills.map((f) => `${f.item.itemId}#${f.item.unit}`);
    expect(new Set(used).size).toBe(used.length);
    expect(m.status).toBe("missing1");
    expect(m.missing[0].slot.id).toBe("r_led");
  });

  it("solves assignments greedy matching would get wrong", () => {
    // 555 blinker: R1 accepts 1k–22k, R2 accepts 10k–100k. With a 10k and a 47k, the 10k must go to R1.
    const kit = [
      item("breadboard"),
      item("battery", { volts: 9 }),
      item("ic", { part_number: "NE555P" }),
      item("resistor", { ohms: 10000 }),
      item("resistor", { ohms: 47000 }),
      item("capacitor", { farads: 10e-6, volts: 25, variant: "electrolytic" }),
      item("resistor", { ohms: 470 }),
      item("led", { color: "red" }),
    ];
    const m = matchRecipe(recipeById("blinker-555")!, kit);
    expect(m.status).toBe("ready");
    const r1 = m.fills.find((f) => f.slotId === "r1")!;
    expect(kit.find((i) => i.id === r1.item.itemId)!.spec.ohms).toBe(10000);
  });

  it("uses quantities as separate units", () => {
    const kit = [item("breadboard"), item("arduino"), item("resistor", { ohms: 220 }, 3), item("led", { color: "red" }), item("led", { color: "yellow" }), item("led", { color: "green" })];
    expect(matchRecipe(recipeById("traffic-light")!, kit).status).toBe("ready");
    const fewer = [item("breadboard"), item("arduino"), item("resistor", { ohms: 220 }, 2), item("led", { color: "red" }), item("led", { color: "yellow" }), item("led", { color: "green" })];
    expect(matchRecipe(recipeById("traffic-light")!, fewer).status).toBe("missing1");
  });

  it("respects value ranges per supply voltage", () => {
    // 220Ω is too small for an LED on 9V but fine on 5V.
    expect(specFits("resistor", { ohms: 220 }, { preset: "led_resistor_9v" })).toBe(false);
    expect(specFits("resistor", { ohms: 220 }, { preset: "led_resistor_5v" })).toBe(true);
    expect(specFits("resistor", { ohms: 470 }, { preset: "led_resistor_9v" })).toBe(true);
  });

  it("applies part-number substitutions", () => {
    for (const pn of ["BC547", "2N2222A", "2N3904", "S8050"]) expect(specFits("transistor", { part_number: pn }, { group: "npn_small" })).toBe(true);
    expect(specFits("transistor", { part_number: "BC557" }, { group: "npn_small" })).toBe(false); // PNP
    expect(specFits("transistor", {}, { group: "npn_small" })).toBe(false); // unknown marking
  });

  it("does not treat an infrared LED as a visible one", () => {
    expect(specFits("led", { color: "infrared" }, {})).toBe(false);
    expect(specFits("led", { color: "red" }, {})).toBe(true);
  });

  it("needs a value to fill a ranged slot", () => {
    expect(specFits("resistor", {}, { preset: "led_resistor_9v" })).toBe(false);
  });

  it("requires electrolytic caps rated above the supply", () => {
    expect(specFits("capacitor", { farads: 1e-5, volts: 6.3, variant: "electrolytic" }, { preset: "timer_cap" })).toBe(false);
    expect(specFits("capacitor", { farads: 1e-5, volts: 25, variant: "electrolytic" }, { preset: "timer_cap" })).toBe(true);
  });

  it("groups and sorts results", () => {
    const res = matchAll(recipes, nightLightKit());
    expect(res.ready.map((r) => r.recipe.id)).toContain("night-light");
    expect(res.ready.map((r) => r.recipe.id)).toContain("led-basic");
    for (const g of [res.ready, res.missing1]) {
      for (let i = 1; i < g.length; i++) expect(g[i].recipe.difficulty).toBeGreaterThanOrEqual(g[i - 1].recipe.difficulty);
    }
    expect(res.hidden.every((r) => r.missingCount > 1)).toBe(true);
  });

  it("does not need optional parts", () => {
    const kit = [
      item("breadboard"), item("battery", { volts: 9 }), item("ic", { part_number: "NE555" }),
      item("resistor", { ohms: 10000 }), item("resistor", { ohms: 47000 }), item("resistor", { ohms: 1000 }),
      item("capacitor", { farads: 1e-5, volts: 16, variant: "electrolytic" }), item("led", { color: "red" }),
    ];
    const m = matchRecipe(recipeById("blinker-555")!, kit);
    expect(m.status).toBe("ready");
    expect(m.optionalFills).toHaveLength(0);
  });
});
