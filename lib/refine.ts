"use client";

import { ai } from "./ai-client";
import type { Lang } from "./ai-tasks";
import { cropToDataUrl, ledColorFromCrop } from "./image";
import { cleanPartNumber, parseBattery, parseCapacitor, parsePot } from "./markings";
import { decodeEitherWay } from "./resistor";
import type { Detection, Spec } from "./schemas";

/**
 * Stage two of scanning: detection says "resistor", this finds out "470Ω".
 * Claude transcribes (marking text, band colours); every value is computed in code.
 */

/** Part types whose value matters for recipes. */
export const NEEDS_VALUE = new Set(["resistor", "capacitor", "ic", "transistor", "led", "battery", "potentiometer", "buzzer"]);

export interface Refined {
  spec: Spec;
  uncertain: boolean;
  note?: string;
}

export async function refineDetection(
  img: HTMLImageElement,
  det: Detection,
  opts: { lang: Lang; demoKey?: string },
): Promise<Refined> {
  const crop = () => cropToDataUrl(img, det.box);
  switch (det.part_type) {
    case "resistor": {
      const r = await ai("resistor_bands", { image: crop() }, opts);
      const d = decodeEitherWay(r.bands);
      if (!d) return { spec: {}, uncertain: true, note: r.note };
      return { spec: { ohms: d.result.ohms }, uncertain: !r.confident || !d.confident, note: r.note };
    }
    case "capacitor": {
      const r = await ai("read_marking", { image: crop(), part_type: "capacitor" }, opts);
      const spec = parseCapacitor(r.lines, r.capacitor_kind);
      return { spec, uncertain: !r.confident || spec.farads === undefined, note: r.note };
    }
    case "ic":
    case "transistor": {
      const r = await ai("read_marking", { image: crop(), part_type: det.part_type }, opts);
      const pn = cleanPartNumber(r.part_number);
      return { spec: pn ? { part_number: pn } : {}, uncertain: !r.confident || !pn, note: r.note };
    }
    case "battery": {
      const r = await ai("read_marking", { image: crop(), part_type: "battery" }, opts);
      const spec = parseBattery(r.lines);
      return { spec, uncertain: !r.confident || spec.volts === undefined, note: r.note };
    }
    case "potentiometer": {
      const r = await ai("read_marking", { image: crop(), part_type: "potentiometer" }, opts);
      const spec = parsePot(r.lines);
      return { spec, uncertain: !r.confident || spec.ohms === undefined, note: r.note };
    }
    case "led": {
      if (det.spec.color === "infrared") return { spec: det.spec, uncertain: false };
      const c = ledColorFromCrop(img, det.box);
      return { spec: { color: c.color }, uncertain: !c.confident };
    }
    case "buzzer":
      // Active vs passive can't be told reliably from a photo: always ask.
      return { spec: det.spec, uncertain: !det.spec.variant };
    default:
      return { spec: det.spec, uncertain: false };
  }
}
