"use client";

import { AppShell } from "@/components/AppShell";
import { Bar, Card, Pill, Section } from "@/components/ui";
import { modelCard } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { MODEL_DEFECT_CLASSES, PART_TYPES } from "@/lib/schemas";

const T = {
  not_trained: { mn: "Загвар хараахан сургагдаагүй — доорх тоонууд сургалтын дараа notebook-оос автоматаар бөглөгдөнө.", en: "Not trained yet — the numbers below are filled in automatically by the training notebook." },
  base: { mn: "Суурь загвар", en: "Base model" },
  how: { mn: "Яаж сургасан", en: "How we fine-tuned it" },
  how_steps: {
    mn: ["Roboflow Universe-ийн нээлттэй өгөгдлийг манай 18 ангилалд хөрвүүлсэн", "Монголд, манай ширээн дээр авсан өөрсдийн зургийг YOLO-World-оор автоматаар тэмдэглэж, гараар зассан", "COCO дээр урьдчилан сургасан YOLO11-ийг fine-tune хийсэн", "ONNX руу экспортлоод утасны хөтөч дээр (WebGPU/WASM) ажиллуулдаг — сервер хэрэггүй"],
    en: ["Public Roboflow Universe datasets remapped onto our 18 classes", "Our own photos taken in Mongolia, on our tables, auto-labelled with YOLO-World and corrected by hand", "Fine-tuned YOLO11 pre-trained on COCO", "Exported to ONNX and run in the phone's browser (WebGPU/WASM) — no server needed"],
  },
  data: { mn: "Өгөгдөл", en: "Data" },
  own: { mn: "Өөрсдийн зураг (Монгол)", en: "Our own photos (Mongolia)" },
  train_val: { mn: "Сургалт / шалгалт", en: "Train / validation" },
  metrics: { mn: "Үр дүн", en: "Results" },
  per_class: { mn: "Ангилал тус бүр", en: "Per class" },
  boxes: { mn: "хүрээ", en: "boxes" },
  examples: { mn: "Жишээ таамаглал", en: "Example predictions" },
  classes: { mn: "Ангиллууд", en: "Classes" },
  defects: { mn: "Хоёр дахь загвар: самбарын гэмтэл", en: "Second model: board defects" },
  defects_body: { mn: "Төлөвлөгдсөн. Одоогоор гэмтлийг Claude vision илрүүлдэг; defects.onnx бэлэн болмогц апп автоматаар шилжинэ.", en: "Planned. Defects are found with Claude vision for now; the app switches automatically once defects.onnx exists." },
};

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(3));

export default function ModelCardPage() {
  const { t, lang } = useI18n();
  const c = modelCard;
  const L = (x: { mn: string; en: string }) => x[lang];
  return (
    <AppShell title={t("model_card")}>
      <p className="text-lg text-muted">{t("model_card_sub")}</p>
      {c.status === "not_trained" && <Card className="mt-3 border-warn bg-amber-50 font-semibold">{L(T.not_trained)}</Card>}

      <Card className="mt-4">
        <div className="text-sm text-muted">{L(T.base)}</div>
        <div className="text-2xl font-extrabold">{c.base_model}</div>
        <div className="mt-1 flex flex-wrap gap-2">
          <Pill>{c.image_size}px</Pill>
          {c.epochs && <Pill>{c.epochs} epochs</Pill>}
          {c.trained_at && <Pill>{c.trained_at}</Pill>}
        </div>
      </Card>

      <div className="grid gap-x-8 lg:grid-cols-2">
      <div>
      <Section title={L(T.how)}>
        <Card>
          <ol className="list-decimal space-y-1 pl-5">
            {T.how_steps[lang].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Card>
      </Section>

      <Section title={L(T.data)}>
        <Card>
          <ul className="grid gap-1">
            {c.data.public_datasets.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <a href={d.url} className="underline" target="_blank" rel="noreferrer">
                  {d.name}
                </a>
                <span className="tabular-nums">{d.images ?? "—"}</span>
              </li>
            ))}
            <li className="flex justify-between gap-2 font-semibold">
              <span>{L(T.own)}</span>
              <span className="tabular-nums">{c.data.own_photos ?? "—"}</span>
            </li>
            <li className="flex justify-between gap-2 text-muted">
              <span>{L(T.train_val)}</span>
              <span className="tabular-nums">
                {c.data.train_images ?? "—"} / {c.data.val_images ?? "—"}
              </span>
            </li>
          </ul>
        </Card>
      </Section>

      </div>
      <div>
      <Section title={L(T.metrics)}>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["mAP50", c.metrics.map50],
              ["mAP50-95", c.metrics.map50_95],
              ["Precision", c.metrics.precision],
              ["Recall", c.metrics.recall],
            ] as const
          ).map(([k, v]) => (
            <Card key={k} className="text-center">
              <div className="text-sm text-muted">{k}</div>
              <div className="text-3xl font-extrabold tabular-nums">{fmt(v)}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={L(T.per_class)}>
        <Card>
          <ul className="grid gap-2">
            {PART_TYPES.map((name) => {
              const row = c.per_class.find((p) => p.name === name);
              return (
                <li key={name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-mono">{name}</span>
                    <span className="tabular-nums text-muted">
                      {row?.train_boxes ?? "—"} {L(T.boxes)} · {fmt(row?.map50 ?? null)}
                    </span>
                  </div>
                  <Bar value={row?.map50 ?? 0} tone="build" />
                </li>
              );
            })}
          </ul>
        </Card>
      </Section>

      </div>
      </div>

      {c.examples.length > 0 && (
        <Section title={L(T.examples)}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {c.examples.map((e) => (
              <figure key={e.image}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.image} alt={e.caption} className="w-full rounded-2xl outline outline-1 -outline-offset-1 outline-black/10" />
                <figcaption className="text-sm text-muted">{e.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      <Section title={L(T.defects)}>
        <Card>
          <p>{L(T.defects_body)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODEL_DEFECT_CLASSES.map((d) => (
              <Pill key={d}>{d}</Pill>
            ))}
          </div>
        </Card>
      </Section>
    </AppShell>
  );
}
