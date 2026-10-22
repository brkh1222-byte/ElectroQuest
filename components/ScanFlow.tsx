"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiError } from "@/lib/ai-client";
import { store, uid, type ScanPhoto } from "@/lib/db";
import { DEMO_PHOTOS, useDemo } from "@/lib/demo";
import { detectParts, warmUp, type DetectResult } from "@/lib/detector";
import { useI18n } from "@/lib/i18n";
import { cropToDataUrl, loadImage, normalizePhoto, urlToPhoto } from "@/lib/image";
import { itemLabel, partName, specKey, specLabel } from "@/lib/parts-ui";
import { NEEDS_VALUE, refineDetection } from "@/lib/refine";
import type { Detection, InventoryItem, Spec } from "@/lib/schemas";
import { Camera } from "./Camera";
import { PhotoView, usePhotoUrl, type OverlayBox } from "./PhotoView";
import { ValuePicker } from "./ValuePicker";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Plus, RotateCcw } from "lucide-react";
import { Button, Card, ErrorBox, I, Pill, Spinner } from "./ui";

type Phase = "capture" | "detecting" | "merge" | "review" | "refine" | "confirm";
type RefineStatus = "pending" | "loading" | "done" | "error";

export interface ScanFlowProps {
  kind: "parts" | "salvage";
  /** Where salvaged parts came from, e.g. "TV remote". */
  from?: string;
  initialPhoto?: { blob: Blob; width: number; height: number; demoKey?: string };
  demoPhoto?: { url: string; key: string };
  onDone: (items: InventoryItem[], scanId: string) => void;
}

interface MergeQuestion {
  photo: number;
  type: string;
  before: number;
  now: number;
}

export function ScanFlow({ kind, from, initialPhoto, demoPhoto = DEMO_PHOTOS.partsPile, onDone }: ScanFlowProps) {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const [phase, setPhase] = useState<Phase>("capture");
  const [photos, setPhotos] = useState<ScanPhoto[]>([]);
  const [lastRun, setLastRun] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mergeQs, setMergeQs] = useState<MergeQuestion[]>([]);
  const [status, setStatus] = useState<Record<string, RefineStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState<{ photo: number; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const images = useRef(new Map<number, HTMLImageElement>());
  const thumbs = useRef(new Map<string, string>());
  const started = useRef(false);

  useEffect(() => {
    void warmUp();
  }, []);

  const imageFor = useCallback(
    async (i: number) => {
      if (!images.current.has(i)) images.current.set(i, await loadImage(photos[i].blob));
      return images.current.get(i)!;
    },
    [photos],
  );

  const addPhoto = useCallback(
    async (p: { blob: Blob; width: number; height: number; demoKey?: string }) => {
      setPhase("detecting");
      setError(null);
      try {
        const img = await loadImage(p.blob);
        const res = await detectParts(img, { demoKey: p.demoKey });
        setLastRun(res);
        const idx = photos.length;
        images.current.set(idx, img);
        const photo: ScanPhoto = { ...p, detections: res.detections, duplicateIds: [] };
        // Same kinds of parts as an earlier photo? Ask the user instead of guessing.
        const qs: MergeQuestion[] = [];
        if (idx > 0) {
          const count = (dets: Detection[], dup: string[]) =>
            dets.filter((d) => !dup.includes(d.id)).reduce<Record<string, number>>((a, d) => ({ ...a, [d.part_type]: (a[d.part_type] ?? 0) + 1 }), {});
          const before: Record<string, number> = {};
          for (const ph of photos) for (const [k, v] of Object.entries(count(ph.detections, ph.duplicateIds))) before[k] = (before[k] ?? 0) + v;
          for (const [type, now] of Object.entries(count(res.detections, []))) if (before[type]) qs.push({ photo: idx, type, before: before[type], now });
        }
        setPhotos((ps) => [...ps, photo]);
        setMergeQs(qs);
        setPhase(qs.length ? "merge" : "review");
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
        setPhase("capture");
      }
    },
    [photos],
  );

  useEffect(() => {
    if (initialPhoto && !started.current) {
      started.current = true;
      void addPhoto(initialPhoto);
    }
  }, [initialPhoto, addPhoto]);

  const answerMerge = (q: MergeQuestion, same: boolean) => {
    if (same) {
      // Same parts from another angle: total = max(before, now), so mark min(before, now) of the new ones as duplicates.
      setPhotos((ps) =>
        ps.map((p, i) => {
          if (i !== q.photo) return p;
          const ids = p.detections.filter((d) => d.part_type === q.type).slice(0, Math.min(q.before, q.now)).map((d) => d.id);
          return { ...p, duplicateIds: [...p.duplicateIds, ...ids] };
        }),
      );
    }
    const rest = mergeQs.filter((x) => x !== q);
    setMergeQs(rest);
    if (!rest.length) setPhase("review");
  };

  const allDets = useMemo(
    () => photos.flatMap((p, pi) => p.detections.filter((d) => !p.duplicateIds.includes(d.id)).map((d) => ({ d, pi }))),
    [photos],
  );

  const updateDet = (pi: number, id: string, patch: Partial<Detection>) =>
    setPhotos((ps) => ps.map((p, i) => (i !== pi ? p : { ...p, detections: p.detections.map((d) => (d.id === id ? { ...d, ...patch } : d)) })));

  const removeDet = (pi: number, id: string) =>
    setPhotos((ps) => ps.map((p, i) => (i !== pi ? p : { ...p, detections: p.detections.filter((d) => d.id !== id) })));

  const refineOne = useCallback(
    async (pi: number, d: Detection) => {
      setStatus((s) => ({ ...s, [d.id]: "loading" }));
      try {
        const img = await imageFor(pi);
        const key = photos[pi].demoKey;
        const r = await refineDetection(img, d, { lang, demoKey: key ? `${key}:${d.id}` : undefined });
        updateDet(pi, d.id, { spec: r.spec, uncertain: r.uncertain, refined: true });
        if (r.note) setNotes((n) => ({ ...n, [d.id]: r.note! }));
        setStatus((s) => ({ ...s, [d.id]: "done" }));
      } catch (e) {
        setNotes((n) => ({ ...n, [d.id]: e instanceof AiError && e.offline ? t("ai_offline") : e instanceof Error ? e.message : String(e) }));
        setStatus((s) => ({ ...s, [d.id]: "error" }));
      }
    },
    [imageFor, lang, photos, t],
  );

  const startRefine = async () => {
    setPhase("refine");
    // Thumbnails for the list.
    for (const { d, pi } of allDets) {
      if (!thumbs.current.has(d.id)) thumbs.current.set(d.id, cropToDataUrl(await imageFor(pi), d.box, 0.2, 160));
    }
    const queue = allDets.filter(({ d }) => NEEDS_VALUE.has(d.part_type) && !d.refined);
    const init: Record<string, RefineStatus> = {};
    for (const { d } of allDets) init[d.id] = NEEDS_VALUE.has(d.part_type) && !d.refined ? "pending" : "done";
    setStatus(init);
    // Three at a time keeps the phone responsive and stays under rate limits.
    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const { d, pi } = queue[next++];
        await refineOne(pi, d);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  };

  const grouped = useMemo(() => {
    const m = new Map<string, { part_type: string; spec: Spec; qty: number; uncertain: boolean; refs: { photo: number; id: string }[] }>();
    for (const { d, pi } of allDets) {
      const k = specKey(d.part_type, d.spec);
      const g = m.get(k) ?? { part_type: d.part_type, spec: d.spec, qty: 0, uncertain: false, refs: [] };
      g.qty++;
      g.uncertain ||= d.uncertain;
      g.refs.push({ photo: pi, id: d.id });
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => a.part_type.localeCompare(b.part_type));
  }, [allDets]);

  const save = async () => {
    setSaving(true);
    const scanId = uid();
    await store.put("scans", { id: scanId, createdAt: Date.now(), kind, photos, from });
    const existing = await store.all("inventory");
    const source = kind === "salvage" ? "salvaged" : "scanned";
    const out: InventoryItem[] = [];
    for (const g of grouped) {
      const refs = g.refs.map((r) => ({ scanId, photo: r.photo, detectionId: r.id }));
      const match = existing.find((i) => i.source === source && i.from === from && specKey(i.part_type, i.spec) === specKey(g.part_type, g.spec));
      const item: InventoryItem = match
        ? { ...match, quantity: match.quantity + g.qty, refs: [...match.refs, ...refs], uncertain: match.uncertain || g.uncertain }
        : { id: uid(), part_type: g.part_type, spec: g.spec, quantity: g.qty, source, from, uncertain: g.uncertain, refs, createdAt: Date.now() };
      out.push(item);
    }
    await store.putMany("inventory", out);
    setSaving(false);
    onDone(out, scanId);
  };

  const current = photos[photos.length - 1];
  const currentUrl = usePhotoUrl(current?.blob);
  const pickerDet = picker ? photos[picker.photo]?.detections.find((d) => d.id === picker.id) : undefined;

  const boxesFor = (p: ScanPhoto): OverlayBox[] =>
    p.detections.map((d) => ({
      id: d.id,
      box: d.box,
      label: itemLabel(d.part_type, d.spec, lang),
      tone: p.duplicateIds.includes(d.id) ? "duplicate" : d.uncertain ? "unsure" : "normal",
    }));

  const sidePanel = (children: React.ReactNode) => <aside className="grid content-start gap-3 lg:sticky lg:top-6">{children}</aside>;

  return (
    <div>
      {phase === "capture" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Camera
            onCapture={async (b) => addPhoto(await normalizePhoto(b))}
            onDemoPhoto={demo ? async () => addPhoto({ ...(await urlToPhoto(demoPhoto.url)), demoKey: demoPhoto.key }) : undefined}
          />
          {sidePanel(
            <>
              <Card>
                <p className="text-lg font-semibold">{t("scan_hint")}</p>
                <p className="mt-2 flex gap-2 text-muted">
                  <I icon={Lightbulb} className="mt-1 text-warn" /> {t("scan_tip_resistor")}
                </p>
              </Card>
              {error && <ErrorBox message={error} />}
              {photos.length > 0 && (
                <Button tone="ghost" onClick={() => setPhase("review")}>
                  <I icon={ArrowLeft} /> {t("back")}
                </Button>
              )}
            </>,
          )}
        </div>
      )}

      {phase === "detecting" && (
        <Card className="flex min-h-72 items-center justify-center">
          <Spinner label={t("scan_detecting")} />
        </Card>
      )}

      {phase === "merge" && current && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <PhotoView src={currentUrl} width={current.width} height={current.height} boxes={boxesFor(current)} />
          {sidePanel(
            <Card>
              <p className="font-semibold">{t("scan_merge_q")}</p>
              {mergeQs.slice(0, 1).map((q) => (
                <div key={q.type} className="mt-3">
                  <p className="text-lg tabular-nums">
                    {partName(q.type, lang)}: {q.before} → {q.now}
                  </p>
                  <div className="mt-3 grid gap-2">
                    <Button tone="ghost" onClick={() => answerMerge(q, true)}>
                      {t("scan_merge_same")} ({Math.max(q.before, q.now)})
                    </Button>
                    <Button tone="ghost" onClick={() => answerMerge(q, false)}>
                      {t("scan_merge_new")} ({q.before + q.now})
                    </Button>
                  </div>
                </div>
              ))}
            </Card>,
          )}
        </div>
      )}

      {phase === "review" && current && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <PhotoView src={currentUrl} width={current.width} height={current.height} boxes={boxesFor(current)} onBoxClick={(id) => removeDet(photos.length - 1, id)} />
            <p className="mt-2 text-sm text-muted">
              {t("scan_tap_to_remove")}
              {lastRun && (
                <>
                  {" "}
                  · <span className="tabular-nums">{lastRun.ms}</span> {t("scan_ms")} · {lastRun.mode === "mock" ? t("scan_detector_mock") : `${lastRun.mode}${lastRun.backend ? `/${lastRun.backend}` : ""}`}
                </>
              )}
            </p>
          </div>
          {sidePanel(
            <>
              <Card>
                <h3 className="mb-3 text-lg font-bold">
                  {t("scan_found")}: <span className="tabular-nums">{allDets.length}</span>
                </h3>
                {allDets.length === 0 ? (
                  <p>{t("scan_none")}</p>
                ) : (
                  <ul className="grid gap-1.5">
                    {Object.entries(allDets.reduce<Record<string, number>>((a, { d }) => ({ ...a, [d.part_type]: (a[d.part_type] ?? 0) + 1 }), {})).map(([k, n]) => (
                      <li key={k} className="flex justify-between gap-2">
                        <span>{partName(k, lang)}</span>
                        <b className="tabular-nums">{n}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Button tone="ghost" onClick={() => setPhase("capture")}>
                <I icon={Plus} /> {t("scan_more")}
              </Button>
              <Button big tone="build" onClick={startRefine} disabled={!allDets.length}>
                {t("scan_read_values")} <I icon={ArrowRight} />
              </Button>
            </>,
          )}
        </div>
      )}

      {phase === "refine" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="grid content-start gap-2 md:grid-cols-2">
            {allDets.map(({ d, pi }) => {
              const st = status[d.id];
              const needs = NEEDS_VALUE.has(d.part_type);
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-3xl border border-transparent bg-surface p-2 pe-3 shadow-[var(--shadow-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbs.current.get(d.id)} alt="" className="size-16 shrink-0 rounded-2xl bg-bg object-cover outline outline-1 -outline-offset-1 outline-black/10" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{partName(d.part_type, lang)}</div>
                    <div className="text-lg">
                      {st === "loading" || st === "pending" ? (
                        <span className="text-muted">{t("scan_reading")}</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-2">
                          {specLabel(d.spec, lang) || (needs ? t("scan_unknown") : "")}
                          {d.uncertain && needs && <Pill tone="warn">? {t("uncertain")}</Pill>}
                        </span>
                      )}
                    </div>
                    {notes[d.id] && (st === "error" || d.uncertain) && <div className="text-sm text-muted">{notes[d.id]}</div>}
                  </div>
                  {st === "error" && (
                    <Button tone="ghost" size="sm" onClick={() => refineOne(pi, d)} aria-label={t("retry")}>
                      <I icon={RotateCcw} />
                    </Button>
                  )}
                  {needs && (
                    <Button size="sm" tone={d.uncertain || !specLabel(d.spec, lang) ? "fix" : "ghost"} onClick={() => setPicker({ photo: pi, id: d.id })} aria-label={t("scan_pick_value")}>
                      ?
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {sidePanel(
            <>
              <Card>
                <h2 className="text-xl font-bold">{t("scan_refine_title")}</h2>
                <p className="mt-1 text-muted">{t("scan_refine_hint")}</p>
              </Card>
              <Button big tone="build" onClick={() => setPhase("confirm")} disabled={Object.values(status).some((s) => s === "loading" || s === "pending")}>
                {t("next")} <I icon={ArrowRight} />
              </Button>
            </>,
          )}
        </div>
      )}

      {phase === "confirm" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="grid content-start gap-2 md:grid-cols-2">
            {grouped.map((g) => (
              <li key={specKey(g.part_type, g.spec)} className="flex items-center justify-between rounded-3xl border border-transparent bg-surface px-5 py-4 text-lg shadow-[var(--shadow-border)]">
                <span>
                  <b className="tabular-nums">{g.qty}×</b> {itemLabel(g.part_type, g.spec, lang)}
                </span>
                {g.uncertain && <Pill tone="warn">?</Pill>}
              </li>
            ))}
          </ul>
          {sidePanel(
            <>
              <Card>
                <h2 className="text-xl font-bold">{t("scan_confirm_title")}</h2>
                <p className="mt-1 text-muted tabular-nums">
                  {grouped.reduce((a, g) => a + g.qty, 0)} {t("parts_count")}
                </p>
              </Card>
              <Button tone="ghost" onClick={() => setPhase("refine")}>
                <I icon={ArrowLeft} /> {t("back")}
              </Button>
              <Button big tone="build" onClick={save} disabled={saving}>
                <I icon={Check} /> {t("scan_add_inventory")}
              </Button>
            </>,
          )}
        </div>
      )}

      {picker && pickerDet && (
        <ValuePicker
          partType={pickerDet.part_type}
          current={pickerDet.spec}
          onClose={() => setPicker(null)}
          onPick={(spec) => {
            updateDet(picker.photo, picker.id, { spec, uncertain: false, refined: true });
            setStatus((s) => ({ ...s, [picker.id]: "done" }));
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}
