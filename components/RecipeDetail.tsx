"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Battery, Check, Clock, Copy, Lock, ShoppingCart, TriangleAlert, Usb } from "lucide-react";
import { AppShell } from "./AppShell";
import { BreadboardSvg } from "./BreadboardSvg";
import { SchematicSvg } from "./SchematicSvg";
import { Button, Card, Difficulty, I, LinkButton, Money, Pill, Section } from "./ui";
import { catalogue, recipeById } from "@/lib/data";
import { store, useLive } from "@/lib/db";
import { useDemo } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import { matchRecipe } from "@/lib/matcher";
import { itemLabel, partName } from "@/lib/parts-ui";
import { unlockedLevels } from "@/lib/progression";
import type { Slot } from "@/lib/schemas";

export function RecipeDetail({ id }: { id: string }) {
  const { t, tr, lang } = useI18n();
  const demo = useDemo();
  const recipe = recipeById(id)!;
  const data = useLive(async () => ({ inv: await store.all("inventory"), done: await store.all("completions") }), ["inventory", "completions"]);
  const m = useMemo(() => (data ? matchRecipe(recipe, data.inv) : null), [data, recipe]);
  const locked = data ? !unlockedLevels(data.done, demo).has(recipe.difficulty) : false;
  const [copied, setCopied] = useState(false);

  const have = (s: Slot) => (m?.fills.filter((f) => f.slotId === s.id).length ?? 0) + (m?.optionalFills.filter((f) => f.slotId === s.id).length ?? 0);
  const slotRow = (s: Slot, optional = false) => {
    const ok = have(s) >= s.quantity;
    return (
      <li key={s.id} className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
        <div>
          <div className="font-semibold">
            <span className="tabular-nums">{s.quantity}×</span> {tr(s.role)} {optional && <span className="text-sm font-normal text-muted">({t("optional")})</span>}
          </div>
          <div className="text-sm text-muted">{itemLabel(s.part_type, s.preferred, lang)}</div>
        </div>
        {m &&
          (ok ? (
            <Pill tone="ok">
              <I icon={Check} /> {t("have_it")}
            </Pill>
          ) : optional ? (
            <Pill>–</Pill>
          ) : (
            <Pill tone="warn">{t("missing")}</Pill>
          ))}
      </li>
    );
  };

  const start = locked ? (
    <p className="flex items-center justify-center gap-2 rounded-2xl bg-line p-4 text-center font-semibold">
      <I icon={Lock} /> {t("proj_unlock_hint")}
    </p>
  ) : (
    <LinkButton href={`/build/${recipe.id}`} tone="build" big className="w-full ps-6 pe-5">
      {t("start_build")} <I icon={ArrowRight} />
    </LinkButton>
  );

  return (
    <AppShell title={tr(recipe.title)} back="/projects">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <p className="text-xl">{tr(recipe.summary)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Difficulty level={recipe.difficulty} />
            <span className="inline-flex items-center gap-1 text-muted tabular-nums">
              <I icon={Clock} /> {recipe.time_minutes} {t("proj_minutes")}
            </span>
            {recipe.uses_arduino ? (
              <Pill tone="build">
                <I icon={Usb} /> Arduino · USB 5V
              </Pill>
            ) : (
              <Pill>
                <I icon={Battery} /> {recipe.supply_v}V
              </Pill>
            )}
          </div>

          <Card className="mt-5">
            <div className="text-sm font-semibold text-muted">{t("learn")}</div>
            <div className="text-lg">{tr(recipe.what_you_learn)}</div>
          </Card>

          <Section title={t("schematic")}>
            <Card className="overflow-x-auto p-3">
              <BreadboardSvg recipe={recipe} />
            </Card>
            <Card className="mt-3 p-3">
              <SchematicSvg recipe={recipe} />
            </Card>
          </Section>

          <div className="grid gap-x-6 md:grid-cols-2">
            <Section title={t("how_to_test")}>
              <Card className="text-lg">{tr(recipe.test)}</Card>
            </Section>
            {recipe.safety.length > 0 && (
              <Section title={t("safety")}>
                <div className="rounded-3xl border border-warn bg-amber-50 p-5">
                  <ul className="space-y-2">
                    {recipe.safety.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <I icon={TriangleAlert} className="mt-1 text-warn" /> {tr(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            )}
          </div>

          {recipe.code && (
            <Section
              title={t("code")}
              right={
                <Button
                  tone="ghost"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(recipe.code!);
                    setCopied(true);
                  }}
                >
                  <I icon={copied ? Check : Copy} /> {copied ? t("copied") : t("copy")}
                </Button>
              }
            >
              <pre className="overflow-x-auto rounded-3xl bg-ink p-5 text-sm text-white">
                <code>{recipe.code}</code>
              </pre>
            </Section>
          )}
        </div>

        <aside className="grid content-start gap-3 lg:sticky lg:top-8">
          <Card>
            <h2 className="text-lg font-bold">{t("parts_needed")}</h2>
            <ul className="mt-1">
              {recipe.slots.filter((s) => s.part_type !== "jumper_wire").map((s) => slotRow(s))}
              {recipe.optional_slots.map((s) => slotRow(s, true))}
            </ul>
            {recipe.materials.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                {t("also_need")}: {recipe.materials.map((x) => `${x.quantity}× ${partName(x.part_type, lang)}`).join(", ")}
              </p>
            )}
            {m?.missing.map((x) => (
              <div key={x.slot.id} className="mt-3 rounded-lg border border-warn bg-amber-50 p-3">
                <b className="flex items-center gap-2 text-warn">
                  <I icon={ShoppingCart} /> {t("proj_buy")}: {x.count}× {itemLabel(x.slot.part_type, x.slot.preferred, lang)}
                </b>
                <div className="text-sm tabular-nums">
                  ≈ <Money mnt={x.price_mnt} /> · {catalogue.shops[x.shop]?.[lang]}
                </div>
              </div>
            ))}
          </Card>
          {start}
        </aside>
      </div>
    </AppShell>
  );
}
