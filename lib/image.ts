"use client";

import type { Box } from "./schemas";

export async function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  return img;
}

function canvasFor(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Downscale so the longest side is at most `max`. */
export function drawScaled(img: CanvasImageSource & { naturalWidth?: number; width: number; height: number }, max: number) {
  const w = (img as HTMLImageElement).naturalWidth || img.width;
  const h = (img as HTMLImageElement).naturalHeight || img.height;
  const k = Math.min(1, max / Math.max(w, h));
  const c = canvasFor(w * k, h * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export function canvasToBlob(c: HTMLCanvasElement, type = "image/jpeg", quality = 0.88): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), type, quality));
}

/** Normalise any captured/uploaded image: max 1600px JPEG (keeps IndexedDB and Claude payloads small). */
export async function normalizePhoto(src: Blob | string, max = 1600): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(src);
  const c = drawScaled(img, max);
  return { blob: await canvasToBlob(c), width: c.width, height: c.height };
}

export function toDataUrl(img: HTMLImageElement | HTMLCanvasElement, max = 1280, quality = 0.85): string {
  return drawScaled(img as HTMLImageElement, max).toDataURL("image/jpeg", quality);
}

/** Crop a detection (pixel box) with padding, return a JPEG data URL for Claude. */
export function cropToDataUrl(img: HTMLImageElement, box: Box, pad = 0.25, max = 512): string {
  const px = box.w * pad;
  const py = box.h * pad;
  const x = Math.max(0, box.x - px);
  const y = Math.max(0, box.y - py);
  const w = Math.min(img.naturalWidth - x, box.w + 2 * px);
  const h = Math.min(img.naturalHeight - y, box.h + 2 * py);
  const k = Math.min(1, max / Math.max(w, h)) * (Math.max(w, h) < 200 ? 2 : 1); // upscale tiny crops a bit
  const c = canvasFor(w * k, h * k);
  c.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.92);
}

/** Rasterise an SVG/any URL to a PNG data URL (Claude accepts raster images only). */
export async function urlToPngDataUrl(url: string, max = 1280): Promise<string> {
  const img = await loadImage(url);
  return drawScaled(img, max).toDataURL("image/png");
}

/** Fetch a URL (e.g. a demo SVG) and return a normalised JPEG photo. */
export async function urlToPhoto(url: string) {
  const img = await loadImage(url);
  const c = drawScaled(img, 1600);
  // SVGs have a transparent background; paint white under them.
  const bg = canvasFor(c.width, c.height);
  const ctx = bg.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, bg.width, bg.height);
  ctx.drawImage(c, 0, 0);
  return { blob: await canvasToBlob(bg), width: bg.width, height: bg.height };
}

/**
 * Guess an LED's colour from its pixels: average hue of the saturated pixels in the middle of the box.
 * Clear (water-clear) LEDs look white regardless of their colour, so low saturation → not confident.
 */
export function ledColorFromCrop(img: HTMLImageElement, box: Box): { color: string; confident: boolean } {
  const c = canvasFor(48, 48);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, box.x + box.w * 0.2, box.y + box.h * 0.1, box.w * 0.6, box.h * 0.5, 0, 0, 48, 48);
  const { data } = ctx.getImageData(0, 0, 48, 48);
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    if (s < 0.35 || max < 0.25) continue;
    let h: number;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    const rad = (h * 60 * Math.PI) / 180;
    sx += Math.cos(rad);
    sy += Math.sin(rad);
    n++;
  }
  const total = data.length / 4;
  if (n < total * 0.08) return { color: "white", confident: false };
  let hue = (Math.atan2(sy, sx) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const color =
    hue < 15 || hue >= 330 ? "red" : hue < 40 ? "orange" : hue < 70 ? "yellow" : hue < 170 ? "green" : hue < 260 ? "blue" : "violet";
  return { color, confident: n > total * 0.2 };
}
