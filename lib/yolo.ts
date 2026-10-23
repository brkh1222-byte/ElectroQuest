"use client";

import type * as OrtTypes from "onnxruntime-web";
import type { Box } from "./schemas";

/**
 * Minimal YOLO (v8/11 export format) runner on onnxruntime-web.
 * Output tensor [1, 4 + nc, N]: cx, cy, w, h in input pixels, then per-class scores (already sigmoid).
 * The runtime is loaded from /ort at runtime (copied there by scripts/copy-ort.mjs), not bundled.
 */

type Ort = typeof OrtTypes;
export type Backend = "webgpu" | "wasm";

let ortPromise: Promise<{ ort: Ort; backend: Backend }> | null = null;

function loadOrt() {
  ortPromise ??= (async () => {
    const backend: Backend = typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
    // Local/Vercel builds serve the runtime from /ort/; Cloudflare's 25 MB file limit means it comes from a CDN there.
    const base = process.env.NEXT_PUBLIC_ORT_BASE || "/ort/";
    const url = `${base}${backend === "webgpu" ? "ort.webgpu.min.mjs" : "ort.wasm.min.mjs"}`;
    const ort: Ort = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    ort.env.wasm.wasmPaths = base;
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
    // On the WASM path run inference in a worker so the UI never freezes.
    if (backend === "wasm") ort.env.wasm.proxy = true;
    return { ort, backend };
  })();
  return ortPromise;
}

export interface RawDetection {
  classIndex: number;
  score: number;
  box: Box; // pixels in the original image
}

export class YoloModel {
  private constructor(
    private ort: Ort,
    private session: OrtTypes.InferenceSession,
    public readonly backend: Backend,
    public readonly imgsz: number,
    public readonly numClasses: number,
  ) {}

  static async load(url: string, numClasses: number, imgsz = 640): Promise<YoloModel> {
    const { ort, backend } = await loadOrt();
    let session: OrtTypes.InferenceSession;
    let used: Backend = backend;
    try {
      session = await ort.InferenceSession.create(url, {
        executionProviders: backend === "webgpu" ? ["webgpu", "wasm"] : ["wasm"],
        graphOptimizationLevel: "all",
      });
    } catch (e) {
      if (backend !== "webgpu") throw e;
      console.warn("[yolo] WebGPU failed, falling back to WASM", e);
      session = await ort.InferenceSession.create(url, { executionProviders: ["wasm"] });
      used = "wasm";
    }
    return new YoloModel(ort, session, used, imgsz, numClasses);
  }

  async run(img: HTMLImageElement, opts: { conf?: number; iou?: number } = {}): Promise<RawDetection[]> {
    const conf = opts.conf ?? 0.3;
    const iou = opts.iou ?? 0.5;
    const S = this.imgsz;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(S / w, S / h);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    const dx = Math.floor((S - dw) / 2);
    const dy = Math.floor((S - dh) / 2);

    // Letterbox to S×S with grey padding, like Ultralytics does.
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = "rgb(114,114,114)";
    ctx.fillRect(0, 0, S, S);
    ctx.drawImage(img, dx, dy, dw, dh);
    const { data } = ctx.getImageData(0, 0, S, S);
    const plane = S * S;
    const chw = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      chw[i] = data[i * 4] / 255;
      chw[plane + i] = data[i * 4 + 1] / 255;
      chw[2 * plane + i] = data[i * 4 + 2] / 255;
    }
    const input = new this.ort.Tensor("float32", chw, [1, 3, S, S]);
    const out = await this.session.run({ [this.session.inputNames[0]]: input });
    const t = out[this.session.outputNames[0]];
    const [, C, N] = t.dims as number[];
    const d = t.data as Float32Array;
    const nc = Math.min(this.numClasses, C - 4);

    const dets: RawDetection[] = [];
    for (let i = 0; i < N; i++) {
      let best = -1;
      let bestScore = conf;
      for (let k = 0; k < nc; k++) {
        const s = d[(4 + k) * N + i];
        if (s > bestScore) {
          bestScore = s;
          best = k;
        }
      }
      if (best < 0) continue;
      const cx = d[i];
      const cy = d[N + i];
      const bw = d[2 * N + i];
      const bh = d[3 * N + i];
      const x = (cx - bw / 2 - dx) / scale;
      const y = (cy - bh / 2 - dy) / scale;
      dets.push({
        classIndex: best,
        score: bestScore,
        box: { x: Math.max(0, x), y: Math.max(0, y), w: Math.min(w, bw / scale), h: Math.min(h, bh / scale) },
      });
    }
    return nms(dets, iou);
  }
}

function iouOf(a: Box, b: Box) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a.w * a.h + b.w * b.h - inter || 1);
}

/** Per-class non-maximum suppression. */
export function nms(dets: RawDetection[], iou: number): RawDetection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const keep: RawDetection[] = [];
  for (const d of sorted) {
    if (keep.every((k) => k.classIndex !== d.classIndex || iouOf(k.box, d.box) < iou)) keep.push(d);
  }
  return keep;
}

export async function modelExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok && !(r.headers.get("content-type") ?? "").includes("text/html");
  } catch {
    return false;
  }
}
