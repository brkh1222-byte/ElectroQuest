import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { LineChart, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Suspense } from "react";
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
  title: { default: "EvalQuest", template: "%s · EvalQuest" },
  description: "Learn to use and build with AI from zero: short lessons, then easy practice problems. Free, no API keys.",
};

const navLink =
  "inline-flex h-9 items-center rounded-lg px-2 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-foreground sm:px-3";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Inside <body> because cacheComponents is on (Clerk Core 3). */}
        <ClerkProvider>
        <header className="border-b border-border bg-surface/90 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-2 text-sm sm:gap-2 sm:px-4">
            <Link href="/" className={`${navLink} mr-1 gap-1.5 font-semibold tracking-tight text-foreground sm:mr-3`}>
              <span aria-hidden className="grid size-6 place-items-center rounded-md bg-accent text-accent-foreground">
                <Sparkles className="size-3.5" strokeWidth={2.25} />
              </span>
              <span className="hidden min-[400px]:inline">EvalQuest</span>
              <span className="sr-only min-[400px]:hidden">EvalQuest</span>
            </Link>
            <Link href="/tracks" className={navLink}>
              Learn
            </Link>
            <Link href="/glossary" className={`${navLink} max-sm:hidden`}>
              Glossary
            </Link>
            <Link href="/problems" className={navLink}>
              Problems
            </Link>
            <Link href="/contests" className={navLink}>
              Contests
            </Link>
            <div className="ml-auto flex items-center">
              {/* Auth state is request data; keep it out of the prerendered shell. */}
              <Suspense>
                <Show when="signed-in" fallback={
                  <SignInButton mode="modal">
                    <button type="button" className={buttonClass({ variant: "secondary", size: "sm" })}>
                      Sign in
                    </button>
                  </SignInButton>
                }>
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="My learning"
                        labelIcon={<LineChart aria-hidden className="size-4" strokeWidth={1.75} />}
                        href="/me"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </Show>
              </Suspense>
            </div>
          </nav>
        </header>
        {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
