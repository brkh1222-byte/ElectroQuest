"use client";

import Link from "next/link";
import { catalogue } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { MatchResult } from "@/lib/matcher";
import { itemLabel } from "@/lib/parts-ui";
import { Clock, Lock, ShoppingCart } from "lucide-react";
import { Difficulty, I, Money, Pill } from "./ui";

export function RecipeCard({ m, locked }: { m: MatchResult; locked?: boolean }) {
  const { t, tr, lang } = useI18n();
  const r = m.recipe;
  return (
    <Link
      href={`/projects/${r.id}`}
      className={`flex h-full flex-col rounded-3xl lg:rounded-[28px] border border-transparent bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96] lg:p-5 ${locked ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold">{tr(r.title)}</h3>
        {locked && (
          <Pill>
            <I icon={Lock} /> {t("proj_locked")}
          </Pill>
        )}
      </div>
      <p className="mt-1 flex-1 text-muted">{tr(r.summary)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <Difficulty level={r.difficulty} />
        <span className="inline-flex items-center gap-1 text-muted tabular-nums">
          <I icon={Clock} /> {r.time_minutes} {t("proj_minutes")}
        </span>
        {r.uses_arduino && <Pill tone="build">Arduino</Pill>}
      </div>
      {m.missing.map((x) => (
        <div key={x.slot.id} className="mt-3 rounded-lg border border-warn bg-amber-50 p-3">
          <div className="flex items-center gap-2 font-semibold text-warn">
            <I icon={ShoppingCart} />
            {t("proj_buy")}: {x.count}× {itemLabel(x.slot.part_type, x.slot.preferred, lang)}
          </div>
          <div className="text-sm tabular-nums">
            ≈ <Money mnt={x.price_mnt} /> · {catalogue.shops[x.shop]?.[lang] ?? x.shop}
          </div>
        </div>
      ))}
    </Link>
  );
}
