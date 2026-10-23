"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { store, useLive } from "@/lib/db";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  const stats = useLive(
    async () => {
      const [inv, done, repairs] = await Promise.all([store.all("inventory"), store.all("completions"), store.all("repairs")]);
      return {
        parts: inv.reduce((a, i) => a + i.quantity, 0),
        projects: done.length,
        repairs: repairs.filter((r) => r.outcome === "fixed" || r.outcome === "salvaged").length,
      };
    },
    ["inventory", "completions", "repairs"],
  );

  return (
    <AppShell>
      <p className="mb-5 text-lg text-muted">{t("tagline")}</p>
      <div className="grid gap-4">
        <Link href="/fix" className="flex min-h-40 flex-col justify-end rounded-3xl bg-fix p-6 text-white active:scale-[0.99] transition-transform">
          <span className="text-5xl" aria-hidden>
            🔧
          </span>
          <span className="mt-2 text-4xl font-extrabold">{t("fix")}</span>
          <span className="text-lg opacity-90">{t("fix_sub")}</span>
        </Link>
        <Link href="/projects" className="flex min-h-40 flex-col justify-end rounded-3xl bg-build p-6 text-white active:scale-[0.99] transition-transform">
          <span className="text-5xl" aria-hidden>
            💡
          </span>
          <span className="mt-2 text-4xl font-extrabold">{t("build")}</span>
          <span className="text-lg opacity-90">{t("build_sub")}</span>
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[
          { n: stats?.parts, label: t("parts_count"), href: "/inventory" },
          { n: stats?.projects, label: t("projects_done"), href: "/progress" },
          { n: stats?.repairs, label: t("repairs_done"), href: "/progress" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-surface p-3">
            <div className="text-3xl font-extrabold tabular-nums">{s.n ?? "–"}</div>
            <div className="text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
        <Link href="/model-card" className="underline underline-offset-4">
          {t("model_card")}
        </Link>
        <Link href="/debug" className="underline underline-offset-4">
          {t("debug")}
        </Link>
      </div>
    </AppShell>
  );
}
