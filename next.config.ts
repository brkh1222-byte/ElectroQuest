import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Problem content (incl. hidden tests), tracks and contests are read from disk at runtime; ship them with the functions.
  outputFileTracingIncludes: {
    "/**": ["./problems/**/*", "./tracks/**/*", "./contests/**/*"],
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
