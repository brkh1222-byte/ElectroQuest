// Copies the onnxruntime-web runtime into public/ort so the detector loads it at runtime (no bundling),
// and the service worker can cache it for offline use.
import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "node_modules/onnxruntime-web/dist");
const dst = path.join(process.cwd(), "public/ort");
const files = [
  "ort.webgpu.min.mjs",
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort.wasm.min.mjs",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.wasm",
];
fs.mkdirSync(dst, { recursive: true });
for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dst, f));
console.log(`copied ${files.length} onnxruntime-web files to public/ort`);
