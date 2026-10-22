import { rawDevices, rawRecipes } from "./generated/data-index";
import substitutionsRaw from "@/data/substitutions.json";
import partsRaw from "@/data/parts.json";
import modelCardRaw from "@/data/model_card.json";
import {
  DeviceProfile,
  ModelCard,
  PartCatalogue,
  Recipe,
  Substitutions,
  type Accept,
  type Slot,
} from "./schemas";

function parseAll<T>(raw: Record<string, unknown>, schema: { parse(x: unknown): T }, what: string): T[] {
  return Object.entries(raw).map(([file, data]) => {
    try {
      return schema.parse(data);
    } catch (e) {
      throw new Error(`${what} ${file} is invalid: ${e instanceof Error ? e.message : e}`);
    }
  });
}

export const recipes: Recipe[] = parseAll(rawRecipes, Recipe, "recipe");
export const devices: DeviceProfile[] = parseAll(rawDevices, DeviceProfile, "device");
export const substitutions: Substitutions = Substitutions.parse(substitutionsRaw);
export const catalogue: PartCatalogue = PartCatalogue.parse(partsRaw);
export const modelCard: ModelCard = ModelCard.parse(modelCardRaw);

export const recipeById = (id: string) => recipes.find((r) => r.id === id);
export const deviceById = (id: string) => devices.find((d) => d.id === id);

/** Slot accept with its preset merged in (explicit fields win). */
export function resolveAccept(accept: Accept): Accept {
  if (!accept.preset) return accept;
  const preset = substitutions.presets[accept.preset];
  if (!preset) throw new Error(`unknown preset ${accept.preset}`);
  return { ...preset.accept, ...accept, preset: undefined };
}

export const allSlots = (r: Recipe): Slot[] => [...r.slots, ...r.optional_slots];
