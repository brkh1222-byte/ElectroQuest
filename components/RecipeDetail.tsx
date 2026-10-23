"use client";

import { useMemo, useState } from "react";
import { AppShell } from "./AppShell";
import { BreadboardSvg } from "./BreadboardSvg";
import { SchematicSvg } from "./SchematicSvg";
import { Button, Card, Difficulty, LinkButton, Money, Pill, Section } from "./ui";
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

  const filled = (s: Slot) => m?.fills.filter((f) => f.slotId === s.id).length ?? 0;
  const slotRow = (s: Slot, optional = false) => {
    const have = filled(s) + (m?.optionalFills.filter((f) => f.slotId === s.id).length ?? 0);
    const ok = have >= s.quantity;
    return (
      <li key={s.id} className="flex items-start justify-between gap-2 border-b border-line py-2 last:border-0">
        <div>
          <div className="font-semibold">
            {s.quantity}× {tr(s.role)} {optional && <span className="text-sm font-normal text-muted">({t("optional")})</span>}
          </div>
          <div className="text-sm text-muted">{itemLabel(s.part_type, s.preferred, lang)}</div>
        </div>
        {m && (ok ? <Pill tone="ok">✓ {t("have_it")}</Pill> : optional ? <Pill>–</Pill> : <Pill tone="warn">{t("missing")}</Pill>)}
      </li>
    );
  };

  return (
    <AppShell title={tr(recipe.title)} back="/projects">
      <p className="text-lg">{tr(recipe.summary)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Difficulty level={recipe.difficulty} />
        <span className="text-muted">
          ⏱ {recipe.time_minutes} {t("proj_minutes")}
        </span>
        {recipe.uses_arduino ? <Pill tone="build">Arduino · USB 5V</Pill> : <Pill>🔋 {recipe.supply_v}V</Pill>}
      </div>

      <Card className="mt-4">
        <div className="text-sm font-semibold text-muted">{t("learn")}</div>
        <div className="text-lg">{tr(recipe.what_you_learn)}</div>
      </Card>

      <Section title={t("parts_needed")}>
        <Card>
          <ul>
            {recipe.slots.filter((s) => s.part_type !== "jumper_wire").map((s) => slotRow(s))}
            {recipe.optional_slots.map((s) => slotRow(s, true))}
          </ul>
          {recipe.materials.length > 0 && (
            <p className="mt-2 text-sm text-muted">
              {t("also_need")}: {recipe.materials.map((x) => `${x.quantity}× ${partName(x.part_type, lang)}`).join(", ")}
            </p>
          )}
        </Card>
        {m?.missing.map((x) => (
          <div key={x.slot.id} className="mt-2 rounded-xl border-2 border-warn bg-amber-50 p-3">
            <b>
              {t("proj_buy")}: {x.count}× {itemLabel(x.slot.part_type, x.slot.preferred, lang)}
            </b>{" "}
            ≈ <Money mnt={x.price_mnt} /> · {catalogue.shops[x.shop]?.[lang]}
          </div>
        ))}
      </Section>

      <Section title={t("schematic")}>
        <Card className="overflow-x-auto p-2">
          <BreadboardSvg recipe={recipe} />
        </Card>
        <Card className="mt-2 p-2">
          <SchematicSvg recipe={recipe} />
        </Card>
      </Section>

      <Section title={t("how_to_test")}>
        <Card>{tr(recipe.test)}</Card>
      </Section>

      {recipe.safety.length > 0 && (
        <Section title={t("safety")}>
          <Card className="border-warn bg-amber-50">
            <ul className="list-disc space-y-1 pl-5">
              {recipe.safety.map((s, i) => (
                <li key={i}>{tr(s)}</li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      {recipe.code && (
        <Section
          title={t("code")}
          right={
            <Button
              tone="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(recipe.code!);
                setCopied(true);
              }}
            >
              {copied ? t("copied") : t("copy")}
            </Button>
          }
        >
          <pre className="overflow-x-auto rounded-2xl bg-ink p-4 text-sm text-white">
            <code>{recipe.code}</code>
          </pre>
        </Section>
      )}

      <div className="sticky bottom-20 mt-6">
        {locked ? (
          <p className="rounded-2xl bg-line p-4 text-center font-semibold">
            🔒 {t("proj_unlock_hint")}
          </p>
        ) : (
          <LinkButton href={`/build/${recipe.id}`} tone="build" big className="w-full shadow-lg">
            {t("start_build")} →
          </LinkButton>
        )}
      </div>
    </AppShell>
  );
}
