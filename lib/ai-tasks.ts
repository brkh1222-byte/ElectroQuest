import { z } from "zod";
import { DEFECT_TYPES } from "./schemas";

/**
 * Every Claude call the app makes is one of these named tasks. Shared by the browser (types) and the
 * /api/ai route (prompt + output schema). Outputs are always structured JSON validated with zod.
 */

export const Lang = z.enum(["mn", "en"]);
export type Lang = z.infer<typeof Lang>;

/** data:image/jpeg;base64,... */
const ImageData = z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/);
const Box01 = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });

export const TASKS = {
  ping: {
    tier: "fast",
    input: z.object({}),
    output: z.object({ ok: z.boolean(), message: z.string() }),
  },
  read_marking: {
    tier: "fast",
    input: z.object({ image: ImageData, part_type: z.string() }),
    output: z.object({
      /** Printed text lines exactly as seen, e.g. ["NE555P", "H1234"] or ["100µF", "16V"]. */
      lines: z.array(z.string()),
      /** The part number if one is printed (NE555, BC547…). */
      part_number: z.string().nullable(),
      /** For capacitors: electrolytic (can) or ceramic (disc), if visible. */
      capacitor_kind: z.enum(["electrolytic", "ceramic", "unknown"]),
      confident: z.boolean(),
      note: z.string(),
    }),
  },
  resistor_bands: {
    tier: "fast",
    input: z.object({ image: ImageData }),
    output: z.object({
      /** Band colours from left to right as seen in the image. */
      bands: z.array(z.string()),
      /** True if a gold/silver band is visible (that end is the tolerance end). */
      tolerance_band_visible: z.boolean(),
      confident: z.boolean(),
      note: z.string(),
    }),
  },
  interpret_answer: {
    tier: "fast",
    input: z.object({
      question: z.string(),
      options: z.array(z.object({ id: z.string(), text: z.string() })),
      user_text: z.string(),
    }),
    output: z.object({
      option_id: z.string().nullable(),
      confident: z.boolean(),
      mentions_mains_power: z.boolean(),
      reply: z.string(),
    }),
  },
  read_multimeter: {
    tier: "fast",
    input: z.object({ image: ImageData }),
    output: z.object({
      display_text: z.string(),
      value: z.number().nullable(),
      unit: z.enum(["V", "mV", "other", "unknown"]),
      is_dc_volts_mode: z.enum(["yes", "no", "unknown"]),
      confident: z.boolean(),
    }),
  },
  board_defects: {
    tier: "strong",
    input: z.object({ image: ImageData, device: z.string(), hints: z.array(z.string()) }),
    output: z.object({
      image_quality: z.enum(["good", "blurry", "too_dark", "too_far", "not_a_board"]),
      findings: z.array(
        z.object({
          defect: z.enum(DEFECT_TYPES),
          box: Box01,
          confidence: z.number(),
          label: z.string(),
        }),
      ),
      summary: z.string(),
    }),
  },
  golden_compare: {
    tier: "strong",
    input: z.object({ image: ImageData, reference: ImageData, device: z.string(), reference_notes: z.string() }),
    output: z.object({
      same_layout: z.enum(["yes", "no", "unsure"]),
      differences: z.array(
        z.object({
          description: z.string(),
          defect: z.enum([...DEFECT_TYPES, "other"]),
          box: Box01,
          confidence: z.number(),
        }),
      ),
      summary: z.string(),
    }),
  },
  ask: {
    tier: "fast",
    input: z.object({
      context_kind: z.enum(["build_step", "repair"]),
      context: z.unknown(),
      question: z.string(),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(20),
    }),
    output: z.object({ answer: z.string(), unsafe_request: z.boolean() }),
  },
} as const;

export type TaskName = keyof typeof TASKS;
export type TaskInput<T extends TaskName> = z.infer<(typeof TASKS)[T]["input"]>;
export type TaskOutput<T extends TaskName> = z.infer<(typeof TASKS)[T]["output"]>;

export const AiRequest = z.object({
  task: z.string(),
  lang: Lang,
  input: z.unknown(),
});

export interface AiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  model?: string;
  latency_ms: number;
  attempts?: number;
}
