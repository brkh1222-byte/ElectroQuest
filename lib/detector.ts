"use client";

import { PART_TYPES, type Detection } from "./schemas";
import { modelExists, YoloModel, type Backend } from "./yolo";
import fixtures from "@/data/demo/fixtures.json";
import { uid } from "./db";

/**
 * Parts detector — the one place that knows how detection runs.
 *  - "onnx":   our fine-tuned YOLO11 (public/models/best.onnx) in the browser, WebGPU → WASM.
 *  - "remote": POST the photo to NEXT_PUBLIC_DETECTOR_URL (for weak phones), same output shape.
 *  - "mock":   fixed detections for demo photos, plausible fake ones otherwise (UI development).
 * "auto" picks onnx when the model file exists, otherwise mock.
 */

export type DetectorMode = "auto" | "onnx" | "remote" | "mock";
export const MODEL_URL = "/models/best.onnx";

/**
 * The parts in our demo kit. Only these compete for each box, so a transistor the model half-thinks is a diode
 * comes out as a transistor. Set NEXT_PUBLIC_KIT_CLASSES=all to detect every part type.
 */
const KIT = (process.env.NEXT_PUBLIC_KIT_CLASSES ?? "resistor,led,transistor,ldr,battery,breadboard,jumper_wire").split(",");
const KIT_CLASSES = KIT[0] === "all" ? undefined : PART_TYPES.flatMap((p, i) => (KIT.includes(p) ? [i] : []));
const REMOTE_URL = process.env.NEXT_PUBLIC_DETECTOR_URL;

export interface DetectResult {
  detections: Detection[];
  ms: number;
  mode: Exclude<DetectorMode, "auto">;
  backend?: Backend;
}

const FIXTURES = fixtures as unknown as Record<string, { width: number; height: number; detections: Detection[] }>;

export function getMode(): DetectorMode {
  try {
    return (localStorage.getItem("detector_mode") as DetectorMode) || "auto";
  } catch {
    return "auto";
  }
}
export function setMode(m: DetectorMode) {
  try {
    localStorage.setItem("detector_mode", m);
  } catch {}
  modelPromise = null;
}

let modelPromise: Promise<YoloModel> | null = null;
let hasModel: Promise<boolean> | null = null;

export function modelAvailable() {
  hasModel ??= modelExists(MODEL_URL);
  return hasModel;
}

async function resolveMode(): Promise<Exclude<DetectorMode, "auto">> {
  const m = getMode();
  if (m !== "auto") return m;
  if (REMOTE_URL) return "remote";
  return (await modelAvailable()) ? "onnx" : "mock";
}

/** Start downloading the model early (e.g. when the scan screen opens). */
export async function warmUp() {
  if ((await resolveMode()) === "onnx") void loadModel().catch(() => {});
}

function loadModel() {
  modelPromise ??= YoloModel.load(MODEL_URL, PART_TYPES.length);
  return modelPromise;
}

export async function detectParts(img: HTMLImageElement, opts: { demoKey?: string } = {}): Promise<DetectResult> {
  const t0 = performance.now();
  // Demo photos always use their recorded detections, so the stage demo is deterministic.
  if (opts.demoKey && FIXTURES[opts.demoKey]) {
    return { detections: fromFixture(opts.demoKey, img), ms: Math.round(performance.now() - t0), mode: "mock" };
  }
  const mode = await resolveMode();
  if (mode === "onnx") {
    const model = await loadModel();
    const raw = await model.runTiled(img, { conf: 0.3, classes: KIT_CLASSES });
    const detections = raw.map((r) => ({
      id: uid(),
      part_type: PART_TYPES[r.classIndex],
      score: r.score,
      box: r.box,
      spec: {},
      uncertain: false,
      refined: false,
    }));
    return { detections, ms: Math.round(performance.now() - t0), mode, backend: model.backend };
  }
  if (mode === "remote" && REMOTE_URL) {
    const blob = await new Promise<Blob>((res) => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      c.toBlob((b) => res(b!), "image/jpeg", 0.88);
    });
    const r = await fetch(REMOTE_URL, { method: "POST", body: blob, headers: { "content-type": "image/jpeg" } });
    if (!r.ok) throw new Error(`detector server ${r.status}`);
    const body = (await r.json()) as { detections: Detection[] };
    return { detections: body.detections.map((d) => ({ ...d, id: d.id ?? uid() })), ms: Math.round(performance.now() - t0), mode };
  }
  return { detections: fakeDetections(img), ms: Math.round(performance.now() - t0), mode: "mock" };
}

function fromFixture(key: string, img: HTMLImageElement): Detection[] {
  const f = FIXTURES[key];
  const sx = img.naturalWidth / f.width;
  const sy = img.naturalHeight / f.height;
  return f.detections.map((d) => ({
    ...d,
    spec: { ...(d.spec ?? {}) },
    uncertain: d.uncertain ?? false,
    refined: d.refined ?? false,
    box: { x: d.box.x * sx, y: d.box.y * sy, w: d.box.w * sx, h: d.box.h * sy },
  }));
}

/** Deterministic fake boxes on a grid, so the UI can be developed without a model. */
function fakeDetections(img: HTMLImageElement): Detection[] {
  const types = ["resistor", "resistor", "led", "capacitor", "transistor", "button", "ldr"];
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  return types.map((t, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return {
      id: uid(),
      part_type: t,
      score: 0.5,
      box: { x: W * (0.06 + col * 0.23), y: H * (0.15 + row * 0.4), w: W * 0.16, h: H * 0.25 },
      spec: {},
      uncertain: true,
      refined: false,
    };
  });
}
