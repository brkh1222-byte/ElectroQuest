"use client";

import Link from "next/link";
import { ArrowRight, Camera, Lightbulb, Recycle, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, I, LinkButton } from "@/components/ui";
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
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <h1 className="enter text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">ElectroQuest</h1>
          <p className="enter enter-1 mt-4 max-w-xl text-xl text-muted lg:text-2xl">{t("tagline")}</p>
          <div className="enter enter-2 mt-8 hidden flex-wrap gap-3 sm:flex">
            <LinkButton href="/fix" tone="fix" big className="ps-6 pe-5">
              <I icon={Wrench} /> {t("fix")} <I icon={ArrowRight} />
            </LinkButton>
            <LinkButton href="/scan" tone="build" big className="ps-6 pe-5">
              <I icon={Camera} /> {t("inv_scan")} <I icon={ArrowRight} />
            </LinkButton>
          </div>
        </div>

        <div className="enter enter-3 grid gap-4 sm:grid-cols-2">
          <ActionCard href="/fix" tone="fix" icon={Wrench} title={t("fix")} sub={t("fix_sub")} />
          <ActionCard href="/projects" tone="build" icon={Lightbulb} title={t("build")} sub={t("build_sub")} />
        </div>
      </section>

      <section className="mt-12 grid grid-cols-3 gap-3 lg:gap-4">
        {[
          { n: stats?.parts, label: t("parts_count"), href: "/inventory" },
          { n: stats?.projects, label: t("projects_done"), href: "/progress" },
          { n: stats?.repairs, label: t("repairs_done"), href: "/progress" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-3xl border border-transparent bg-surface p-4 text-center shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] lg:p-6"
          >
            <div className="text-3xl font-extrabold tabular-nums lg:text-5xl">{s.n ?? "–"}</div>
            <div className="text-sm text-muted lg:text-base">{s.label}</div>
          </Link>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">{t("home_how")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Wrench, title: t("fix"), body: t("home_step_fix"), color: "text-fix bg-orange-50" },
            { icon: Recycle, title: t("salvage"), body: t("home_step_salvage"), color: "text-warn bg-amber-50" },
            { icon: Lightbulb, title: t("build"), body: t("home_step_build"), color: "text-build bg-teal-50" },
          ].map((s, i) => (
            <Card key={s.title} className="p-6">
              <div className="flex items-center gap-3">
                <span className={`flex size-11 items-center justify-center rounded-2xl ${s.color}`}>
                  <s.icon aria-hidden className="size-6" strokeWidth={2} absoluteStrokeWidth />
                </span>
                <span className="text-sm font-bold text-muted tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-muted">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function ActionCard({ href, tone, icon: Icon, title, sub }: { href: string; tone: "fix" | "build"; icon: typeof Wrench; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className={`group flex min-h-48 flex-col justify-between rounded-3xl p-6 text-white transition-[scale,filter] duration-150 ease-out hover:brightness-110 active:scale-[0.96] lg:min-h-64 ${tone === "fix" ? "bg-fix" : "bg-build"}`}
    >
      <Icon aria-hidden className="size-10" strokeWidth={2.5} absoluteStrokeWidth />
      <div>
        <div className="text-3xl font-extrabold lg:text-4xl">{title}</div>
        <div className="mt-1 text-lg opacity-90">{sub}</div>
      </div>
    </Link>
  );
}
