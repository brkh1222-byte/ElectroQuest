"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "./AppShell";
import { AskSheet } from "./AskSheet";
import { BreadboardSvg } from "./BreadboardSvg";
import { PhotoView, usePhotoUrl, type OverlayBox } from "./PhotoView";
import { Button, Card, Pill } from "./ui";
import { allSlots, recipeById, substitutions } from "@/lib/data";
import { store, useLive, type Scan } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { matchRecipe } from "@/lib/matcher";
import { itemLabel, partName } from "@/lib/parts-ui";
import { BADGES, earnedBadges } from "@/lib/progression";
import { parseHole } from "@/lib/breadboard";
import type { InventoryItem, Recipe } from "@/lib/schemas";

type Phase = "pick" | "steps" | "test" | "done";

export function BuildMode({ id }: { id: string }) {
  const { t, tr, lang } = useI18n();
  const recipe = recipeById(id)!;
  const [phase, setPhase] = useState<Phase>("pick");
  const [step, setStep] = useState(0);
  const [asking, setAsking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const data = useLive(
    async () => {
      const inv = await store.all("inventory");
      const m = matchRecipe(recipe, inv);
      const scanIds = new Set<string>();
      for (const f of [...m.fills, ...m.optionalFills]) {
        const item = inv.find((i) => i.id === f.item.itemId);
        const ref = item?.refs[f.item.unit];
        if (ref) scanIds.add(ref.scanId);
      }
      const scans = (await Promise.all([...scanIds].map((s) => store.get("scans", s)))).filter(Boolean) as Scan[];
      return { inv, m, scans };
    },
    ["inventory", "scans"],
    [id],
  );

  // Which inventory unit fills which slot, and where it is on a scan photo.
  const picks = useMemo(() => {
    if (!data) return [];
    return [...data.m.fills, ...data.m.optionalFills].map((f) => {
      const item = data.inv.find((i) => i.id === f.item.itemId)!;
      const slot = allSlots(recipe).find((s) => s.id === f.slotId)!;
      return { f, item, slot, ref: item.refs[f.item.unit] };
    });
  }, [data, recipe]);

  const finish = async () => {
    const before = earnedBadges(await store.all("completions"), await store.all("repairs"));
    await store.put("completions", { id: recipe.id, completedAt: Date.now() });
    const after = earnedBadges(await store.all("completions"), await store.all("repairs"));
    setNewBadges([...after].filter((b) => !before.has(b)));
    setPhase("done");
  };

  const s = recipe.steps[step];
  const stepContext = { recipe: { id: recipe.id, title: recipe.title, slots: recipe.slots, layout: recipe.layout, steps: recipe.steps, test: recipe.test, safety: recipe.safety, code: recipe.code }, current_step: step + 1, current_step_text: s?.text };

  return (
    <AppShell title={tr(recipe.title)} back={`/projects/${recipe.id}`} hideNav>
      {phase === "pick" && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-extrabold">{t("build_pick")}</h2>
          <p className="text-muted">{t("build_pick_hint")}</p>
          {data?.scans.map((scan) =>
            scan.photos.map((p, pi) => {
              const here = picks.filter((x) => x.ref?.scanId === scan.id && x.ref.photo === pi);
              if (!here.length) return null;
              return <PickPhoto key={`${scan.id}-${pi}`} scan={scan} photo={pi} picks={here} />;
            }),
          )}
          <Card>
            <ul className="grid gap-2">
              {picks.map((x, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-lg">
                  <span>
                    {itemLabel(x.item.part_type, x.item.spec, lang)} <span className="text-sm text-muted">· {tr(x.slot.role)}</span>
                  </span>
                  {!x.ref && <SourceTag item={x.item} />}
                </li>
              ))}
            </ul>
            {data && data.m.missing.length > 0 && (
              <p className="mt-3 font-semibold text-warn">
                {t("missing")}: {data.m.missing.map((x) => `${x.count}× ${tr(x.slot.role)}`).join(", ")}
              </p>
            )}
            {recipe.materials.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                {t("also_need")}: {recipe.materials.map((x) => `${x.quantity}× ${partName(x.part_type, lang)}`).join(", ")}
              </p>
            )}
          </Card>
          <Button big tone="build" onClick={() => setPhase("steps")}>
            {t("next")} →
          </Button>
        </div>
      )}

      {phase === "steps" && s && (
        <div className="grid gap-4 pb-28">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {t("step")} {step + 1} {t("of")} {recipe.steps.length}
            </span>
            <div className="flex gap-1">
              {recipe.steps.map((_, i) => (
                <span key={i} className={`h-2 w-5 rounded-full ${i <= step ? "bg-build" : "bg-line"}`} />
              ))}
            </div>
          </div>
          <p className="text-2xl font-semibold leading-snug">{tr(s.text)}</p>
          <PinoutNote recipe={recipe} stepAdds={s.add} picks={picks} />
          <Card className="overflow-x-auto p-2">
            <BreadboardSvg recipe={recipe} step={step} />
          </Card>
          <Placements recipe={recipe} adds={s.add} />
          <Button tone="ghost" onClick={() => setAsking(true)}>
            💬 {t("ask_step")}
          </Button>
          <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface p-3">
            <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
              <Button big tone="ghost" onClick={() => (step === 0 ? setPhase("pick") : setStep(step - 1))}>
                ← {t("back")}
              </Button>
              <Button big tone="build" onClick={() => (step === recipe.steps.length - 1 ? setPhase("test") : setStep(step + 1))}>
                {t("next")} →
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === "test" && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-extrabold">{t("test_title")}</h2>
          <p className="text-2xl leading-snug">{tr(recipe.test)}</p>
          <Card className="overflow-x-auto p-2">
            <BreadboardSvg recipe={recipe} />
          </Card>
          {failed && <Card className="border-warn bg-amber-50 text-lg">{t("not_working_tips")}</Card>}
          <Button big tone="ok" onClick={finish}>
            ✓ {t("it_works")}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button tone="ghost" onClick={() => setFailed(true)}>
              {t("not_working")}
            </Button>
            <Button tone="ghost" onClick={() => setAsking(true)}>
              💬 {t("ask_step")}
            </Button>
          </div>
          <Button tone="ghost" onClick={() => { setStep(0); setPhase("steps"); }}>
            ← {t("step")} 1
          </Button>
        </div>
      )}

      {phase === "done" && (
        <div className="grid gap-4 text-center">
          <div className="text-7xl">🎉</div>
          <h2 className="text-3xl font-extrabold">{t("completed")}</h2>
          {newBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {newBadges.map((b) => (
                <Pill key={b} tone="build">
                  {BADGES.find((x) => x.id === b)?.icon} {t(`badge_${b}` as "badge_first_circuit")}
                </Pill>
              ))}
            </div>
          )}
          <Link href="/projects" className="min-h-14 rounded-2xl bg-build p-4 text-xl font-bold text-white">
            {t("nav_projects")}
          </Link>
          <Link href="/progress" className="min-h-14 rounded-2xl border-2 border-line p-4 text-xl font-bold">
            {t("nav_progress")}
          </Link>
        </div>
      )}

      {asking && <AskSheet title={t("ask_step")} contextKind="build_step" context={stepContext} onClose={() => setAsking(false)} />}
    </AppShell>
  );
}

function SourceTag({ item }: { item: InventoryItem }) {
  const { t } = useI18n();
  if (item.source === "salvaged") return <Pill tone="fix">♻ {item.from ?? t("src_salvaged")}</Pill>;
  return <Pill>{t(item.source === "manual" ? "src_manual" : "src_scanned")}</Pill>;
}

function PickPhoto({ scan, photo, picks }: { scan: Scan; photo: number; picks: { ref?: { detectionId: string }; slot: { role: { mn: string; en: string } } }[] }) {
  const { tr } = useI18n();
  const p = scan.photos[photo];
  const url = usePhotoUrl(p.blob);
  const ids = new Map(picks.map((x) => [x.ref!.detectionId, tr(x.slot.role)]));
  const boxes: OverlayBox[] = p.detections.map((d) => ({
    id: d.id,
    box: d.box,
    tone: ids.has(d.id) ? "highlight" : "dim",
    label: ids.get(d.id),
  }));
  return <PhotoView src={url} width={p.width} height={p.height} boxes={boxes} dimOthers />;
}

function holeName(h: string, t: (k: "rail_plus" | "rail_minus") => string): string {
  const p = parseHole(h);
  if (p?.kind === "rail") return `${p.row.endsWith("+") ? t("rail_plus") : t("rail_minus")} ${p.col}`;
  return h;
}

/** Auto-generated exact positions for everything placed in this step. */
function Placements({ recipe, adds }: { recipe: Recipe; adds: string[] }) {
  const { t, lang } = useI18n();
  const rows = adds.flatMap((a) => {
    const c = recipe.layout.components.find((x) => x.ref === a);
    if (c) {
      if (!Object.keys(c.pins).length) return [];
      const slot = allSlots(recipe).find((s) => s.id === c.slot);
      const name = slot ? itemLabel(slot.part_type, slot.preferred, lang) : c.ref;
      return [`${c.ref} · ${name}: ${Object.entries(c.pins).filter(([k]) => !k.endsWith("b")).map(([k, v]) => `${k}→${holeName(v, t)}`).join(", ")}`];
    }
    const w = recipe.layout.wires.find((x) => x.id === a);
    return w ? [`〰 ${holeName(w.from, t)} → ${holeName(w.to, t)}`] : [];
  });
  if (!rows.length) return null;
  return (
    <Card>
      <div className="mb-1 text-sm font-semibold text-muted">{t("placements")}</div>
      <ul className="space-y-1 font-mono text-[15px]">
        {rows.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </Card>
  );
}

/** If this step places a transistor, show the pin order of the exact part the user is using. */
function PinoutNote({ recipe, stepAdds, picks }: { recipe: Recipe; stepAdds: string[]; picks: { slot: { id: string }; item: InventoryItem }[] }) {
  const { t } = useI18n();
  const q = recipe.layout.components.find((c) => stepAdds.includes(c.ref) && c.kind === "npn");
  if (!q) return null;
  const used = picks.find((p) => p.slot.id === q.slot)?.item.spec.part_number;
  const pinouts = substitutions.groups.npn_small.pinouts;
  const key = used && Object.keys(pinouts).find((k) => used.toUpperCase().startsWith(k));
  if (!key) return null;
  return (
    <Card className="border-build bg-teal-50 text-lg">
      {t(pinouts[key] === "C-B-E" ? "pinout_cbe" : "pinout_ebc").replace("{pn}", used)}
    </Card>
  );
}
