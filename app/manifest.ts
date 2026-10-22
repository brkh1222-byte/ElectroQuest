import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Засвар AI",
    short_name: "Засвар AI",
    description: "Эвдэрсэн төхөөрөмжөө засаж, эд ангиас нь шинэ зүйл бүтээ",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f5f1",
    theme_color: "#f6f5f1",
    lang: "mn",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
