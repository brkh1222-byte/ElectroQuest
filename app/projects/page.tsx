"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RecipeCard } from "@/components/RecipeCard";
import { Camera, ChevronDown, Check } from "lucide-react";
import { I, LinkButton, Pill } from "@/components/ui";
import { recipes } from "@/lib/data";
import { store, useLive } from "@/lib/db";
import { useDemo } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import { matchAll, matchRecipe } from "@/lib/matcher";
import { unlockedLevels } from "@/lib/progression";

export default function ProjectsPage() {
  const { t, tr } = useI18n();
  const demo = useDemo();
  const [tab, setTab] = useState<"ready" | "missing1">("ready");
  const [showAll, setShowAll] = useState(false);
  const [fromScan, setFromScan] = useState(false);
  const data = useLive(async () => ({ inv: await store.all("inventory"), done: await store.all("completions") }), ["inventory", "completions"]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off read of the query string
    setFromScan(new URLSearchParams(window.location.search).get("from") === "scan");
  }, []);

  const res = useMemo(() => (data ? matchAll(recipes, data.inv) : null), [data]);
  const levels = useMemo(() => unlockedLevels(data?.done ?? [], demo), [data, demo]);
  const doneIds = new Set((data?.done ?? []).map((d) => d.id));
  const list = res ? res[tab] : [];

  return (
    <AppShell
      title={t("proj_title")}
      action={
        <LinkButton href="/scan" tone="build">
          <I icon={Camera} /> {t("inv_scan")}
        </LinkButton>
      }
    >
      <LinkButton href="/scan" tone="build" big className="w-full lg:hidden">
        <I icon={Camera} /> {t("inv_scan")}
      </LinkButton>
      {fromScan && res && res.ready.length > 0 && (
        <p className="enter mt-4 rounded-2xl bg-teal-50 p-4 text-lg font-semibold text-build">
          {t("proj_you_can_build")} {res.ready.slice(0, 3).map((m) => tr(m.recipe.title)).join(", ")}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-line/60 p-1 sm:inline-grid sm:min-w-[28rem]" role="tablist">
        {(["ready", "missing1"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-11 rounded-xl border border-transparent px-4 font-bold transition-[background-color,color] duration-150 ${tab === k ? "bg-surface text-ink shadow-[var(--shadow-border)]" : "text-muted hover:text-ink"}`}
          >
            {t(k === "ready" ? "proj_ready" : "proj_missing1")} {res && <span className="tabular-nums">({res[k].length})</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {res && list.length === 0 && <p className="text-lg text-muted sm:col-span-2 xl:col-span-3">{t(tab === "ready" ? "proj_none_ready" : "proj_none_missing")}</p>}
        {list.map((m) => (
          <div key={m.recipe.id} className="relative">
            <RecipeCard m={m} locked={!levels.has(m.recipe.difficulty)} />
            {doneIds.has(m.recipe.id) && (
              <span className="absolute bottom-3 right-3">
                <Pill tone="ok">
                  <I icon={Check} />
                </Pill>
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        aria-expanded={showAll}
        className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line font-semibold text-muted transition-colors duration-150 hover:text-ink"
        onClick={() => setShowAll(!showAll)}
      >
        {t("proj_all")} <span className="tabular-nums">({recipes.length})</span>
        <I icon={ChevronDown} className={`transition-transform duration-150 ${showAll ? "rotate-180" : ""}`} />
      </button>
      {showAll && data && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recipes
            .slice()
            .sort((a, b) => a.difficulty - b.difficulty)
            .map((r) => (
              <RecipeCard key={r.id} m={{ ...matchRecipe(r, data.inv), missing: [] }} locked={!levels.has(r.difficulty)} />
            ))}
        </div>
      )}
    </AppShell>
  );
}
