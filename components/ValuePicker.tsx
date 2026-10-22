"use client";

import { useState } from "react";
import { catalogue } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { specLabel } from "@/lib/parts-ui";
import type { Spec } from "@/lib/schemas";
import { parseValue } from "@/lib/units";
import { Button, Sheet } from "./ui";

/** The "?" fallback: pick a value from a short list, or type one. */
export function ValuePicker({ partType, current, onPick, onClose }: { partType: string; current?: Spec; onPick: (s: Spec) => void; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const choices = catalogue.parts[partType]?.choices ?? [];
  const typed = (): Spec | null => {
    const v = parseValue(text);
    if (partType === "resistor" || partType === "potentiometer") return v ? { ohms: v } : null;
    if (partType === "capacitor") return v ? { farads: v > 1e-2 ? v * 1e-6 : v } : null; // "100" means 100µF
    if (partType === "battery") return v ? { volts: v } : null;
    if (partType === "ic" || partType === "transistor") return text.trim() ? { part_number: text.trim().toUpperCase() } : null;
    if (partType === "led") return text.trim() ? { color: text.trim().toLowerCase() } : null;
    return null;
  };
  return (
    <Sheet onClose={onClose}>
      <div>
        <h3 className="mb-3 text-lg font-bold">{t("scan_pick_value")}</h3>
        {choices.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {choices.map((c) => {
              const active = current && specLabel(current, lang) === specLabel(c.spec, lang);
              return (
                <Button key={c.label} tone={active ? "build" : "ghost"} onClick={() => onPick(c.spec)}>
                  {specLabel(c.spec, lang) || c.label}
                </Button>
              );
            })}
          </div>
        )}
        {partType !== "buzzer" && (
          <div className="mt-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("value_typed")}
              className="min-h-12 flex-1 rounded-xl border-2 border-line px-3 text-base"
            />
            <Button
              tone="plain"
              disabled={!typed()}
              onClick={() => {
                const s = typed();
                if (s) onPick(s);
              }}
            >
              {t("save")}
            </Button>
          </div>
        )}
        <Button tone="ghost" className="mt-3 w-full" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>
    </Sheet>
  );
}
