import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "AI Arena", template: "%s · AI Arena" },
  description: "Learn to build with AI by solving problems. Free, no API keys, no GPUs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border bg-surface">
          <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 text-sm">
            <Link href="/" className="font-semibold tracking-tight">
              AI Arena
            </Link>
            <Link href="/problems" className="text-muted hover:text-foreground">
              Problems
            </Link>
            <span className="text-muted/60" title="Coming soon">
              Tracks
            </span>
            <span className="text-muted/60" title="Coming soon">
              Contests
            </span>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
