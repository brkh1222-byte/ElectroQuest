"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Boxes, Bug, BrainCircuit, Camera, House, Lightbulb, Trophy, Wrench, type LucideIcon } from "lucide-react";
import { useI18n, type StringKey } from "@/lib/i18n";
import { I } from "./ui";

const NAV: { href: string; key: StringKey; icon: LucideIcon; match?: string[] }[] = [
  { href: "/", key: "nav_home", icon: House },
  { href: "/fix", key: "fix", icon: Wrench },
  { href: "/projects", key: "nav_projects", icon: Lightbulb, match: ["/projects", "/build"] },
  { href: "/scan", key: "inv_scan", icon: Camera },
  { href: "/inventory", key: "nav_inventory", icon: Boxes },
  { href: "/progress", key: "nav_progress", icon: Trophy },
];
const MOBILE_NAV = NAV.filter((n) => n.href !== "/scan" && n.href !== "/fix");
const FOOTER: { href: string; key: StringKey; icon: LucideIcon }[] = [
  { href: "/model-card", key: "model_card", icon: BrainCircuit },
  { href: "/debug", key: "debug", icon: Bug },
];

function isActive(path: string, n: { href: string; match?: string[] }) {
  if (n.href === "/") return path === "/";
  return (n.match ?? [n.href]).some((m) => path.startsWith(m));
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "mn" ? "en" : "mn")}
      className={`min-h-10 rounded-xl border border-transparent bg-surface px-3 text-sm font-bold shadow-[var(--shadow-border)] transition-[scale,box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96] ${className}`}
      aria-label={t("language")}
    >
      {lang === "mn" ? "EN" : "МН"}
    </button>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-xl px-2 py-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
      <img src="/icons/app.svg" alt="" className="size-9 rounded-[10px]" />
      <span className="text-xl font-extrabold tracking-tight">ElectroQuest</span>
    </Link>
  );
}

/**
 * Web-app frame: a fixed sidebar on desktop, a compact top bar with bottom tabs on phones (the camera flows
 * still need to work one-handed). `title` renders as the page heading; `back` adds a back control.
 */
export function AppShell({
  title,
  back,
  children,
  hideNav,
  action,
  width = "wide",
}: {
  title?: string;
  back?: string | true;
  children: ReactNode;
  /** Hide the phone bottom tabs (focused flows like build mode). The desktop sidebar always stays. */
  hideNav?: boolean;
  action?: ReactNode;
  width?: "wide" | "narrow";
}) {
  const { t } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const goBack = () => (back === true ? router.back() : back && router.push(back));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-line bg-surface/60 p-4 lg:flex">
        <Logo />
        <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
          {NAV.map((n) => {
            const active = isActive(path, n);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold transition-colors duration-150 ${active ? "bg-ink text-white" : "text-muted hover:bg-bg hover:text-ink"}`}
              >
                <I icon={n.icon} />
                {t(n.key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
          {FOOTER.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path.startsWith(n.href) ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 ${path.startsWith(n.href) ? "bg-bg text-ink" : "text-muted hover:bg-bg hover:text-ink"}`}
            >
              <I icon={n.icon} />
              {t(n.key)}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between px-3">
            <span className="text-sm text-muted">{t("language")}</span>
            <LangToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phone top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur lg:hidden">
          {back ? (
            <button onClick={goBack} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent bg-surface shadow-[var(--shadow-border)] transition-[scale] duration-150 ease-out active:scale-[0.96]" aria-label={t("back")}>
              <I icon={ArrowLeft} />
            </button>
          ) : null}
          <div className="flex-1 truncate">{back && title ? <span className="text-lg font-extrabold">{title}</span> : <Logo />}</div>
          <LangToggle />
        </header>

        <main className={`mx-auto w-full flex-1 px-4 pt-5 lg:px-10 lg:pt-10 ${width === "narrow" ? "max-w-3xl" : "max-w-7xl"} ${hideNav ? "pb-10" : "pb-28 lg:pb-12"}`}>
          {(title || back) && (
            <div className="mb-6 hidden items-center gap-3 lg:flex">
              {back && (
                <button
                  onClick={goBack}
                  className="flex size-11 items-center justify-center rounded-xl border border-transparent bg-surface shadow-[var(--shadow-border)] transition-[scale,box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]"
                  aria-label={t("back")}
                >
                  <I icon={ArrowLeft} />
                </button>
              )}
              {title && <h1 className="flex-1 truncate text-3xl font-extrabold tracking-tight">{title}</h1>}
              {action}
            </div>
          )}
          {title && !back && <h1 className="mb-4 text-2xl font-extrabold tracking-tight lg:hidden">{title}</h1>}
          {children}
        </main>

        {!hideNav && (
          <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface lg:hidden" aria-label="Main">
            <div className="grid grid-cols-4">
              {MOBILE_NAV.map((n) => {
                const active = isActive(path, n);
                return (
                  <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? "text-ink" : "text-muted"}`}>
                    <n.icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} absoluteStrokeWidth />
                    {t(n.key)}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
