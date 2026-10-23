import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prompts are read from disk by the /api/ai route at runtime; make sure they ship with the function.
  outputFileTracingIncludes: {
    "/api/ai": ["./prompts/**/*"],
  },
  // Cross-origin isolation lets onnxruntime-web use multi-threaded WASM on phones without WebGPU.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
