import { z } from "zod";
import classes from "@/shared/classes.json";
import defectClasses from "@/shared/defect_classes.json";

export const PART_TYPES = classes as readonly string[];
export const MODEL_DEFECT_CLASSES = defectClasses as readonly string[];

export const PartType = z.string().refine((s) => PART_TYPES.includes(s), {
  message: "unknown part_type (must be one of shared/classes.json)",
});
export type PartType = string;

/** Bilingual text. Mongolian is the default UI language. */
export const L = z.object({ mn: z.string().min(1), en: z.string().min(1) });
export type L = z.infer<typeof L>;

const Range = z.object({ min: z.number(), max: z.number() }).refine((r) => r.min <= r.max, "min > max");

// ---------- Part specs (what we know about one physical part) ----------

export const Spec = z.object({
  ohms: z.number().positive().optional(),
  farads: z.number().positive().optional(),
  /** Battery voltage, or a capacitor's voltage rating. */
  volts: z.number().positive().optional(),
  color: z.string().optional(),
  part_number: z.string().optional(),
  /** e.g. "electrolytic" / "ceramic" capacitor, "active" / "passive" buzzer, "9v" battery. */
  variant: z.string().optional(),
});
export type Spec = z.infer<typeof Spec>;

export const Accept = z.object({
  ohms: Range.optional(),
  farads: Range.optional(),
  volts: Range.optional(),
  colors: z.array(z.string()).optional(),
  part_numbers: z.array(z.string()).optional(),
  /** Name of a part-number group in data/substitutions.json. */
  group: z.string().optional(),
  /** Name of a value-range preset in data/substitutions.json (merged into this accept). */
  preset: z.string().optional(),
  variants: z.array(z.string()).optional(),
});
export type Accept = z.infer<typeof Accept>;

export const Slot = z.object({
  id: z.string(),
  role: L,
  part_type: PartType,
  quantity: z.number().int().positive(),
  accept: Accept.default({}),
  /** What we recommend if the user has to buy it. */
  preferred: Spec.default({}),
});
export type Slot = z.infer<typeof Slot>;

// ---------- Breadboard layout + schematic ----------

export const ComponentKind = z.enum([
  "resistor",
  "led",
  "diode",
  "cap_electrolytic",
  "cap_ceramic",
  "npn",
  "ic_dip8",
  "button",
  "buzzer",
  "potentiometer",
  "ldr",
  "battery",
  "arduino",
  "servo",
  "dc_motor",
  "ultrasonic",
  "touch_plate",
]);
export type ComponentKind = z.infer<typeof ComponentKind>;

export const LayoutComponent = z.object({
  ref: z.string(),
  /** Recipe slot this component is filled from. Omit for things like touch plates made from bare wire. */
  slot: z.string().optional(),
  kind: ComponentKind,
  /** pin name → hole id ("e12", "t+3", "b-7"). Off-board components (battery, arduino, servo, motor) have no pins here. */
  pins: z.record(z.string(), z.string()).default({}),
  label: z.string().optional(),
});
export type LayoutComponent = z.infer<typeof LayoutComponent>;

export const Wire = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  color: z.enum(["red", "black", "yellow", "green", "blue", "orange", "white"]).default("yellow"),
});
export type Wire = z.infer<typeof Wire>;

export const Layout = z.object({
  components: z.array(LayoutComponent),
  wires: z.array(Wire),
});
export type Layout = z.infer<typeof Layout>;

export const Schematic = z.object({
  /** Each net lists the pins it connects, as "REF.pin". Off-board terminals use the same form ("BAT.+", "ARD.D2"). */
  nets: z.array(z.object({ name: z.string(), pins: z.array(z.string()).min(2) })),
});
export type Schematic = z.infer<typeof Schematic>;

export const Step = z.object({
  text: L,
  /** Component refs and wire ids placed in this step. */
  add: z.array(z.string()).default([]),
});
export type Step = z.infer<typeof Step>;

export const Recipe = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: L,
  summary: L,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  time_minutes: z.number().int().positive(),
  what_you_learn: L,
  /** Nominal supply voltage. The app only allows low-voltage DC. */
  supply_v: z.number().positive().max(12),
  uses_arduino: z.boolean(),
  slots: z.array(Slot).min(1),
  optional_slots: z.array(Slot).default([]),
  /** Consumables listed for the user but not matched (jumper wires). */
  materials: z.array(z.object({ part_type: PartType, quantity: z.number().int().positive() })).default([]),
  layout: Layout,
  schematic: Schematic,
  steps: z.array(Step).min(1),
  code: z.string().optional(),
  test: L,
  safety: z.array(L).default([]),
});
export type Recipe = z.infer<typeof Recipe>;

// ---------- Substitutions + part catalogue ----------

export const Substitutions = z.object({
  groups: z.record(
    z.string(),
    z.object({
      label: L,
      part_numbers: z.array(z.string()).min(1),
      /** Pin order per part number, read left→right with the flat/marked face toward you. */
      pinouts: z.record(z.string(), z.string()).default({}),
    }),
  ),
  presets: z.record(z.string(), z.object({ label: L, accept: Accept })),
});
export type Substitutions = z.infer<typeof Substitutions>;

export const PartCatalogue = z.object({
  shops: z.record(z.string(), L),
  parts: z.record(
    z.string(),
    z.object({
      name: L,
      price_mnt: z.number().int().nonnegative(),
      shop: z.string(),
      /** Values offered in the "?" pick-list for this part type. */
      choices: z.array(z.object({ label: z.string(), spec: Spec })).default([]),
    }),
  ),
});
export type PartCatalogue = z.infer<typeof PartCatalogue>;

// ---------- Device profiles (repair) ----------

/** Multipliers applied to each cause's likelihood. 0 rules a cause out; 1 (the default) means no information. */
export const Effects = z.record(z.string(), z.number().nonnegative());
export type Effects = z.infer<typeof Effects>;

export const Question = z.object({
  id: z.string(),
  text: L,
  answers: z.array(z.object({ id: z.string(), text: L, effects: Effects.default({}) })).min(2),
  /** Only ask when an earlier question got one of these answers. */
  ask_if: z.record(z.string(), z.array(z.string())).optional(),
});
export type Question = z.infer<typeof Question>;

export const GuidedTest = z.object({
  id: z.string(),
  /** yes_no covers phone-only checks such as the re-pairing procedure or "try another cable". */
  kind: z.enum(["ir_camera", "multimeter_battery", "yes_no"]),
  title: L,
  instructions: z.array(L).min(1),
  /** For multimeter tests: the batteries this device may use and the healthy voltage for each. */
  battery_options: z.array(z.object({ id: z.string(), label: L, volts: Range })).default([]),
  outcomes: z.array(z.object({ id: z.string(), text: L, effects: Effects.default({}) })).min(2),
  ask_if: z.record(z.string(), z.array(z.string())).optional(),
});
export type GuidedTest = z.infer<typeof GuidedTest>;

export const Fix = z.object({
  summary: L,
  parts: z.array(z.object({ name: L, price_mnt: z.number().int().nonnegative() })).default([]),
  tools: z.array(L).default([]),
  no_solder_option: L.optional(),
  steps: z.array(L).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  time_minutes: z.number().int().positive(),
  shop_price_mnt: z.number().int().nonnegative(),
  give_up_when: L,
  safety: z.array(L).default([]),
  needs_soldering: z.boolean().default(false),
});
export type Fix = z.infer<typeof Fix>;

export const Cause = z.object({
  id: z.string(),
  name: L,
  /** Rough share of failures, used as the prior. */
  frequency: z.number().positive(),
  symptoms: z.array(L).default([]),
  why: L,
  /** True when the honest answer is "not worth fixing": the flow goes to salvage. */
  unfixable: z.boolean().default(false),
  fix: Fix,
});
export type Cause = z.infer<typeof Cause>;

export const DEFECT_TYPES = [
  "corrosion",
  "burn_mark",
  "bulging_capacitor",
  "cracked_joint",
  "lifted_leg",
  "missing_part",
  "worn_pad",
  "liquid_residue",
] as const;
export const DefectType = z.enum(DEFECT_TYPES);
export type DefectType = z.infer<typeof DefectType>;

export const DeviceProfile = z.object({
  id: z.string(),
  name: L,
  icon: z.string(),
  power: z.literal("battery"),
  battery: L,
  causes: z.array(Cause).min(1),
  questions: z.array(Question).min(1),
  tests: z.array(GuidedTest).default([]),
  open_guide: z.array(L).min(1),
  visual_checks: z.array(
    z.object({
      defect: DefectType,
      where: L,
      effects: Effects,
    }),
  ),
  golden_references: z
    .array(z.object({ model: z.string(), image: z.string(), notes: L }))
    .default([]),
  salvage: z.array(z.object({ part_type: PartType, spec: Spec.default({}), note: L })).default([]),
});
export type DeviceProfile = z.infer<typeof DeviceProfile>;

// ---------- Detections + inventory (stored in IndexedDB) ----------

export const Box = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
export type Box = z.infer<typeof Box>;

export const Detection = z.object({
  id: z.string(),
  part_type: PartType,
  score: z.number(),
  /** Pixel coordinates in the photo's natural size. */
  box: Box,
  spec: Spec.default({}),
  uncertain: z.boolean().default(false),
  /** True once the value has been read or picked. */
  refined: z.boolean().default(false),
});
export type Detection = z.infer<typeof Detection>;

export const DetRef = z.object({ scanId: z.string(), photo: z.number().int(), detectionId: z.string() });
export type DetRef = z.infer<typeof DetRef>;

export const InventoryItem = z.object({
  id: z.string(),
  part_type: PartType,
  spec: Spec.default({}),
  quantity: z.number().int().positive(),
  source: z.enum(["scanned", "salvaged", "manual"]),
  from: z.string().optional(),
  uncertain: z.boolean().default(false),
  refs: z.array(DetRef).default([]),
  createdAt: z.number(),
});
export type InventoryItem = z.infer<typeof InventoryItem>;

// ---------- Model card (written by the training notebook) ----------

export const ModelCard = z.object({
  status: z.enum(["not_trained", "trained"]),
  model_name: z.string(),
  base_model: z.string(),
  trained_at: z.string().nullable(),
  image_size: z.number().int(),
  epochs: z.number().int().nullable(),
  data: z.object({
    public_datasets: z.array(z.object({ name: z.string(), url: z.string(), images: z.number().int().nullable() })),
    own_photos: z.number().int().nullable(),
    train_images: z.number().int().nullable(),
    val_images: z.number().int().nullable(),
  }),
  metrics: z.object({
    map50: z.number().nullable(),
    map50_95: z.number().nullable(),
    precision: z.number().nullable(),
    recall: z.number().nullable(),
  }),
  per_class: z.array(
    z.object({
      name: z.string(),
      train_boxes: z.number().int().nullable(),
      map50: z.number().nullable(),
    }),
  ),
  examples: z.array(z.object({ image: z.string(), caption: z.string() })).default([]),
});
export type ModelCard = z.infer<typeof ModelCard>;
