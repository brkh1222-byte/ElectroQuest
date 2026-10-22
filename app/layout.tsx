import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Засвар AI",
  description: "Эвдэрсэн төхөөрөмжөө засаж, эд ангиас нь шинэ зүйл бүтээ. Fix broken gadgets and build with their parts.",
  applicationName: "Засвар AI",
  appleWebApp: { capable: true, title: "Засвар AI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
