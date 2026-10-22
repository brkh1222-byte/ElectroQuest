"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n, type StringKey } from "@/lib/i18n";

const NAV: { href: string; key: StringKey; icon: string }[] = [
  { href: "/", key: "nav_home", icon: "⌂" },
  { href: "/inventory", key: "nav_inventory", icon: "▦" },
  { href: "/projects", key: "nav_projects", icon: "✦" },
  { href: "/progress", key: "nav_progress", icon: "★" },
];

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "mn" ? "en" : "mn")}
      className="min-h-11 rounded-xl border-2 border-line bg-surface px-3 text-sm font-bold"
      aria-label={t("language")}
    >
      {lang === "mn" ? "EN" : "МН"}
    </button>
  );
}

export function AppShell({
  title,
  back,
  children,
  hideNav,
  action,
}: {
  title?: string;
  back?: string | true;
  children: ReactNode;
  hideNav?: boolean;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur">
        {back && (
          <button
            onClick={() => (back === true ? router.back() : router.push(back))}
            className="min-h-11 min-w-11 rounded-xl border-2 border-line bg-surface px-3 text-lg font-bold"
            aria-label={t("back")}
          >
            ←
          </button>
        )}
        <h1 className="flex-1 truncate text-xl font-extrabold">{title ?? t("app_name")}</h1>
        {action}
        <LangToggle />
      </header>
      <main className={`flex-1 px-4 pt-4 ${hideNav ? "pb-8" : "pb-28"}`}>{children}</main>
      {!hideNav && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface">
          <div className="mx-auto grid max-w-xl grid-cols-4">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${active ? "text-ink" : "text-muted"}`}>
                  <span className="text-2xl leading-none" aria-hidden>
                    {n.icon}
                  </span>
                  {t(n.key)}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
