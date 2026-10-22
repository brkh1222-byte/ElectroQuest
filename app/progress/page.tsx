"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Check, Lock, Recycle } from "lucide-react";
import { Card, I, Pill, Section } from "@/components/ui";
import { deviceById, recipeById } from "@/lib/data";
import { store, useLive } from "@/lib/db";
import { useDemo } from "@/lib/demo";
import { useI18n, type StringKey } from "@/lib/i18n";
import { BADGES, earnedBadges, unlockedLevels } from "@/lib/progression";

export default function ProgressPage() {
  const { t, tr } = useI18n();
  const demo = useDemo();
  const data = useLive(async () => ({ done: await store.all("completions"), repairs: await store.all("repairs") }), ["completions", "repairs"]);
  const earned = data ? earnedBadges(data.done, data.repairs) : new Set();
  const levels = unlockedLevels(data?.done ?? [], demo);
  const finished = (data?.repairs ?? []).filter((r) => r.outcome === "fixed" || r.outcome === "salvaged").sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  return (
    <AppShell title={t("prog_title")}>
      <Section title={t("level")}>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((l) => (
            <Card key={l} className={`text-center ${levels.has(l) ? "border-build" : "opacity-50"}`}>
              <div className="text-3xl font-extrabold">{l}</div>
              <div className="flex items-center justify-center gap-1 text-sm">
                {!levels.has(l) && <I icon={Lock} />} {levels.has(l) ? t("level_unlocked") : t("proj_locked")}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t("badges")}>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => (
            <Card key={b.id} className={`text-center ${earned.has(b.id) ? "" : "opacity-30 grayscale"}`}>
              <div className="text-4xl">{b.icon}</div>
              <div className="mt-1 text-sm font-semibold">{t(`badge_${b.id}` as StringKey)}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t("completed_projects")}>
        {!data?.done.length && <p className="text-muted">{t("none_yet")}</p>}
        <ul className="grid gap-2">
          {data?.done
            .sort((a, b) => b.completedAt - a.completedAt)
            .map((c) => {
              const r = recipeById(c.id);
              return (
                r && (
                  <li key={c.id}>
                    <Link href={`/projects/${r.id}`} className="flex justify-between rounded-3xl border border-transparent bg-surface p-4 text-lg shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)]">
                      <span>{tr(r.title)}</span>
                      <span className="text-muted">{new Date(c.completedAt).toLocaleDateString()}</span>
                    </Link>
                  </li>
                )
              );
            })}
        </ul>
      </Section>

      <Section title={t("repairs")}>
        {!finished.length && <p className="text-muted">{t("none_yet")}</p>}
        <ul className="grid gap-2">
          {finished.map((r) => {
            const d = deviceById(r.deviceId);
            const cause = d?.causes.find((c) => c.id === r.causeId);
            return (
              <li key={r.id} className="rounded-3xl border border-transparent bg-surface p-4 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold">{d ? tr(d.name) : r.deviceId}</span>
                  <Pill tone={r.outcome === "fixed" ? "ok" : "fix"}>
                    <I icon={r.outcome === "fixed" ? Check : Recycle} />
                  </Pill>
                </div>
                {cause && <div className="text-muted">{tr(cause.name)}</div>}
              </li>
            );
          })}
        </ul>
      </Section>
    </AppShell>
  );
}
