import { catalogue } from "./data";
import type { Spec } from "./schemas";
import { formatSpec } from "./units";

type Lang = "mn" | "en";

const COLOR_NAMES: Record<string, { mn: string; en: string }> = {
  red: { mn: "улаан", en: "red" },
  orange: { mn: "улбар шар", en: "orange" },
  yellow: { mn: "шар", en: "yellow" },
  green: { mn: "ногоон", en: "green" },
  blue: { mn: "цэнхэр", en: "blue" },
  violet: { mn: "ягаан", en: "violet" },
  white: { mn: "цагаан", en: "white" },
  infrared: { mn: "хэт улаан (IR)", en: "infrared (IR)" },
};
const VARIANT_NAMES: Record<string, { mn: string; en: string }> = {
  active: { mn: "идэвхтэй", en: "active" },
  passive: { mn: "идэвхгүй", en: "passive" },
  electrolytic: { mn: "электролит", en: "electrolytic" },
  ceramic: { mn: "керамик", en: "ceramic" },
};

export function partName(partType: string, lang: Lang): string {
  return catalogue.parts[partType]?.name[lang] ?? partType;
}

/** "220Ω", "100µF 16V", "улаан" — the value part of a label. */
export function specLabel(spec: Spec, lang: Lang): string {
  const s: Spec = { ...spec };
  const extra: string[] = [];
  if (s.color) {
    extra.push(COLOR_NAMES[s.color]?.[lang] ?? s.color);
    delete s.color;
  }
  if (s.variant) {
    if (VARIANT_NAMES[s.variant] && !s.part_number && s.farads === undefined) extra.push(VARIANT_NAMES[s.variant][lang]);
    delete s.variant;
  }
  return [formatSpec(s), ...extra].filter(Boolean).join(" ");
}

export function itemLabel(partType: string, spec: Spec, lang: Lang): string {
  const v = specLabel(spec, lang);
  return v ? `${partName(partType, lang)} ${v}` : partName(partType, lang);
}

/** Group key: two parts are "the same item" if type and spec match. */
export function specKey(partType: string, spec: Spec): string {
  const keys = Object.keys(spec).sort() as (keyof Spec)[];
  return partType + "|" + keys.map((k) => `${k}=${spec[k]}`).join(",");
}
