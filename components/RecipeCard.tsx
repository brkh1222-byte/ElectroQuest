"use client";

import Link from "next/link";
import { catalogue } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { MatchResult } from "@/lib/matcher";
import { itemLabel } from "@/lib/parts-ui";
import { Difficulty, Money, Pill } from "./ui";

export function RecipeCard({ m, locked }: { m: MatchResult; locked?: boolean }) {
  const { t, tr, lang } = useI18n();
  const r = m.recipe;
  return (
    <Link href={`/projects/${r.id}`} className={`block rounded-2xl border border-line bg-surface p-4 active:scale-[0.99] transition-transform ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold">{tr(r.title)}</h3>
        {locked && <Pill>🔒 {t("proj_locked")}</Pill>}
      </div>
      <p className="mt-1 text-muted">{tr(r.summary)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <Difficulty level={r.difficulty} />
        <span className="text-muted">
          ⏱ {r.time_minutes} {t("proj_minutes")}
        </span>
        {r.uses_arduino && <Pill tone="build">Arduino</Pill>}
      </div>
      {m.missing.map((x) => (
        <div key={x.slot.id} className="mt-3 rounded-xl border-2 border-warn bg-amber-50 p-3">
          <div className="font-semibold text-warn">
            {t("proj_buy")}: {x.count}× {itemLabel(x.slot.part_type, x.slot.preferred, lang)}
          </div>
          <div className="text-sm">
            ≈ <Money mnt={x.price_mnt} /> · {catalogue.shops[x.shop]?.[lang] ?? x.shop}
          </div>
        </div>
      ))}
    </Link>
  );
}
