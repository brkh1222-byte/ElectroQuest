"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RecipeCard } from "@/components/RecipeCard";
import { LinkButton, Pill } from "@/components/ui";
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
    <AppShell title={t("proj_title")}>
      <LinkButton href="/scan" tone="build" big className="w-full">
        📷 {t("inv_scan")}
      </LinkButton>
      {fromScan && res && res.ready.length > 0 && (
        <p className="mt-4 rounded-2xl bg-teal-50 p-3 text-lg font-semibold text-build">
          {t("proj_you_can_build")} {res.ready.slice(0, 3).map((m) => tr(m.recipe.title)).join(", ")}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-line/60 p-1" role="tablist">
        {(["ready", "missing1"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-12 rounded-xl font-bold ${tab === k ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {t(k === "ready" ? "proj_ready" : "proj_missing1")} {res && <span className="tabular-nums">({res[k].length})</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {res && list.length === 0 && <p className="text-lg text-muted">{t(tab === "ready" ? "proj_none_ready" : "proj_none_missing")}</p>}
        {list.map((m) => (
          <div key={m.recipe.id} className="relative">
            <RecipeCard m={m} locked={!levels.has(m.recipe.difficulty)} />
            {doneIds.has(m.recipe.id) && (
              <span className="absolute bottom-3 right-3">
                <Pill tone="ok">✓</Pill>
              </span>
            )}
          </div>
        ))}
      </div>

      <button className="mt-6 min-h-12 w-full rounded-2xl border-2 border-dashed border-line font-semibold text-muted" onClick={() => setShowAll(!showAll)}>
        {t("proj_all")} ({recipes.length}) {showAll ? "▲" : "▼"}
      </button>
      {showAll && data && (
        <div className="mt-3 grid gap-3">
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
