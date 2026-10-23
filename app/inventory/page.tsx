"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ValuePicker } from "@/components/ValuePicker";
import { ArrowRight, Camera, Minus, Plus } from "lucide-react";
import { Button, I, LinkButton, Pill, Sheet } from "@/components/ui";
import { catalogue } from "@/lib/data";
import { store, uid, useLive } from "@/lib/db";
import { useI18n, type StringKey } from "@/lib/i18n";
import { partName, specLabel } from "@/lib/parts-ui";
import { PART_TYPES, type InventoryItem, type Spec } from "@/lib/schemas";

const SRC_KEY: Record<InventoryItem["source"], StringKey> = { scanned: "src_scanned", salvaged: "src_salvaged", manual: "src_manual" };
const SRC_TONE = { scanned: "build", salvaged: "fix", manual: "muted" } as const;

export default function InventoryPage() {
  const { t, lang } = useI18n();
  const items = useLive(() => store.all("inventory"), ["inventory"]);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<string>("resistor");

  const groups = useMemo(() => {
    const m = new Map<string, InventoryItem[]>();
    for (const i of items ?? []) m.set(i.part_type, [...(m.get(i.part_type) ?? []), i]);
    return PART_TYPES.filter((p) => m.has(p)).map((p) => ({ type: p, items: m.get(p)! }));
  }, [items]);

  const setQty = async (i: InventoryItem, q: number) => {
    if (q <= 0) await store.delete("inventory", i.id);
    else await store.put("inventory", { ...i, quantity: q, refs: i.refs.slice(0, q) });
  };

  const addManual = async (spec: Spec) => {
    const existing = (items ?? []).find((i) => i.source === "manual" && i.part_type === newType && JSON.stringify(i.spec) === JSON.stringify(spec));
    if (existing) await store.put("inventory", { ...existing, quantity: existing.quantity + 1 });
    else await store.put("inventory", { id: uid(), part_type: newType, spec, quantity: 1, source: "manual", uncertain: false, refs: [], createdAt: Date.now() });
    setAdding(false);
  };

  // Parts with values go through the value picker; the rest are added straight away.
  const nextAfterType = () => {
    const hasValues = (catalogue.parts[newType]?.choices.length ?? 0) > 0;
    if (!hasValues) return addManual({});
    setAdding(false);
    setEditing({ id: "__new", part_type: newType, spec: {}, quantity: 1, source: "manual", uncertain: false, refs: [], createdAt: 0 });
  };

  return (
    <AppShell title={t("inv_title")}>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <LinkButton href="/scan" tone="build">
          <I icon={Camera} /> {t("inv_scan")}
        </LinkButton>
        <Button tone="ghost" onClick={() => setAdding(true)}>
          <I icon={Plus} /> {t("inv_add")}
        </Button>
      </div>

      {items && items.length === 0 && <p className="mt-6 text-lg text-muted">{t("inv_empty")}</p>}

      <div className="mt-2 grid gap-x-6 lg:grid-cols-2">
      {groups.map((g) => (
        <section key={g.type} className="mt-5">
          <h2 className="mb-2 text-lg font-bold">
            {partName(g.type, lang)} <span className="text-muted">({g.items.reduce((a, i) => a + i.quantity, 0)})</span>
          </h2>
          <ul className="grid gap-2">
            {g.items.map((i) => (
              <li key={i.id} className="rounded-3xl border border-transparent bg-surface p-4 shadow-[var(--shadow-border)]">
                <div className="flex items-center gap-2">
                  <button className="min-h-12 flex-1 text-left text-lg font-semibold" onClick={() => setEditing(i)}>
                    {specLabel(i.spec, lang) || partName(i.part_type, lang)} {i.uncertain && <Pill tone="warn">? {t("uncertain")}</Pill>}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button tone="ghost" size="sm" className="min-w-10 px-0" onClick={() => setQty(i, i.quantity - 1)} aria-label="−">
                      <I icon={Minus} />
                    </Button>
                    <span className="w-8 text-center text-xl font-bold tabular-nums">{i.quantity}</span>
                    <Button tone="ghost" size="sm" className="min-w-10 px-0" onClick={() => setQty(i, i.quantity + 1)} aria-label="+">
                      <I icon={Plus} />
                    </Button>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  <Pill tone={SRC_TONE[i.source]}>{t(SRC_KEY[i.source])}</Pill>
                  {i.from && (
                    <Pill>
                      {t("from")}: {i.from}
                    </Pill>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      </div>

      {editing && editing.id !== "__new" && (
        <ValuePicker
          partType={editing.part_type}
          current={editing.spec}
          onClose={() => setEditing(null)}
          onPick={async (spec) => {
            await store.put("inventory", { ...editing, spec, uncertain: false });
            setEditing(null);
          }}
        />
      )}

      {adding && (
        <Sheet onClose={() => setAdding(false)} wide>
          <h3 className="mb-3 text-lg font-bold">{t("inv_part_type")}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PART_TYPES.map((p) => (
              <Button key={p} size="sm" tone={newType === p ? "build" : "ghost"} onClick={() => setNewType(p)}>
                {partName(p, lang)}
              </Button>
            ))}
          </div>
          <Button big tone="plain" className="mt-4 w-full" onClick={nextAfterType}>
            {t("next")} <I icon={ArrowRight} />
          </Button>
        </Sheet>
      )}
      {editing?.id === "__new" && (
        <ValuePicker partType={editing.part_type} onClose={() => setEditing(null)} onPick={async (spec) => { await addManual(spec); setEditing(null); }} />
      )}
    </AppShell>
  );
}
