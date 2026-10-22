"use client";

import { ai } from "./ai-client";
import type { Lang } from "./ai-tasks";
import { toDataUrl, urlToPngDataUrl } from "./image";
import { MODEL_DEFECT_CLASSES, type DefectType, type DeviceProfile } from "./schemas";
import { modelExists, YoloModel } from "./yolo";

/**
 * Board defect detection behind one interface. Today: Claude vision with a strict structured prompt.
 * Later: our own fine-tuned defect model (public/models/defects.onnx, training/board_defects_finetune.ipynb).
 * When the model file exists it is used and the UI does not change.
 */

export interface DefectFinding {
  id: string;
  defect: DefectType | "other";
  /** Fractions of the image, 0..1 */
  box: { x: number; y: number; w: number; h: number };
  confidence: number;
  label: string;
  source: "claude" | "model" | "golden";
}

export interface DefectReport {
  quality: "good" | "blurry" | "too_dark" | "too_far" | "not_a_board";
  findings: DefectFinding[];
  summary: string;
  detector: string;
}

interface Ctx {
  device: DeviceProfile;
  lang: Lang;
  demoKey?: string;
}

export interface DefectDetector {
  name: string;
  detect(img: HTMLImageElement, ctx: Ctx): Promise<DefectReport>;
}

let n = 0;
const fid = () => `f${Date.now().toString(36)}${n++}`;

const claudeDetector: DefectDetector = {
  name: "claude-vision",
  async detect(img, { device, lang, demoKey }) {
    const r = await ai(
      "board_defects",
      {
        image: toDataUrl(img, 1568),
        device: device.name.en,
        hints: device.visual_checks.map((v) => `${v.defect}: ${v.where.en}`),
      },
      { lang, demoKey: demoKey && `${demoKey}:defects` },
    );
    return {
      quality: r.image_quality,
      findings: r.findings.map((f) => ({ ...f, id: fid(), source: "claude" as const })),
      summary: r.summary,
      detector: this.name,
    };
  },
};

const MODEL_URL = "/models/defects.onnx";
const CLASS_TO_DEFECT: Record<string, DefectType> = {
  corroded: "corrosion",
  burnt: "burn_mark",
  bulging_cap: "bulging_capacitor",
  cracked_joint: "cracked_joint",
  worn_pad: "worn_pad",
};
const LABELS: Record<DefectType, { mn: string; en: string }> = {
  corrosion: { mn: "Исэлдэлт", en: "Corrosion" },
  burn_mark: { mn: "Түлэгдсэн толбо", en: "Burn mark" },
  bulging_capacitor: { mn: "Хавдсан конденсатор", en: "Bulging capacitor" },
  cracked_joint: { mn: "Хагарсан гагнуур", en: "Cracked solder joint" },
  lifted_leg: { mn: "Ховхорсон хөл", en: "Lifted leg" },
  missing_part: { mn: "Дутуу эд анги", en: "Missing part" },
  worn_pad: { mn: "Элэгдсэн товчлуур", en: "Worn button pad" },
  liquid_residue: { mn: "Шингэний ул мөр", en: "Liquid residue" },
};
export const defectLabel = (d: DefectType | "other", lang: Lang) => (d === "other" ? "?" : LABELS[d][lang]);

let modelP: Promise<YoloModel> | null = null;
const onnxDetector: DefectDetector = {
  name: "defects.onnx",
  async detect(img, ctx) {
    modelP ??= YoloModel.load(MODEL_URL, MODEL_DEFECT_CLASSES.length);
    const model = await modelP;
    const raw = await model.run(img, { conf: 0.35 });
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const findings: DefectFinding[] = raw.map((r) => {
      const defect = CLASS_TO_DEFECT[MODEL_DEFECT_CLASSES[r.classIndex]];
      return {
        id: fid(),
        defect,
        box: { x: r.box.x / W, y: r.box.y / H, w: r.box.w / W, h: r.box.h / H },
        confidence: r.score,
        label: LABELS[defect][ctx.lang],
        source: "model",
      };
    });
    return { quality: "good", findings, summary: "", detector: this.name };
  },
};

let chosen: Promise<DefectDetector> | null = null;
export function getDefectDetector(): Promise<DefectDetector> {
  chosen ??= modelExists(MODEL_URL).then((ok) => (ok ? onnxDetector : claudeDetector));
  return chosen;
}

/** Side-by-side check against a photo of a healthy board of the same model. */
export async function compareWithGolden(
  img: HTMLImageElement,
  reference: { image: string; notes: { mn: string; en: string } },
  ctx: Ctx,
): Promise<{ sameLayout: "yes" | "no" | "unsure"; findings: DefectFinding[]; summary: string }> {
  const r = await ai(
    "golden_compare",
    {
      image: toDataUrl(img, 1280),
      reference: await urlToPngDataUrl(reference.image, 1280),
      device: ctx.device.name.en,
      reference_notes: reference.notes.en,
    },
    { lang: ctx.lang, demoKey: ctx.demoKey && `${ctx.demoKey}:golden` },
  );
  return {
    sameLayout: r.same_layout,
    findings:
      r.same_layout === "no"
        ? []
        : r.differences.map((d) => ({ id: fid(), defect: d.defect, box: d.box, confidence: d.confidence, label: d.description, source: "golden" as const })),
    summary: r.summary,
  };
}
