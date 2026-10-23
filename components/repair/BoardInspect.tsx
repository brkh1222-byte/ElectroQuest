"use client";

import { useCallback, useState } from "react";
import { AiError } from "@/lib/ai-client";
import { compareWithGolden, getDefectDetector, type DefectFinding, type DefectReport } from "@/lib/defects";
import { DEMO_PHOTOS, useDemo } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import { loadImage, normalizePhoto, urlToPhoto } from "@/lib/image";
import type { DeviceProfile } from "@/lib/schemas";
import { Camera } from "../Camera";
import { PhotoView, usePhotoUrl, type OverlayBox } from "../PhotoView";
import { Button, Card, ErrorBox, Pill, Spinner } from "../ui";

export interface BoardPhoto {
  blob: Blob;
  width: number;
  height: number;
  demoKey?: string;
}

/** Photograph the open board, find visible defects (Claude or our defect model), compare with a healthy board. */
export function BoardInspect({
  device,
  onDone,
}: {
  device: DeviceProfile;
  onDone: (photo: BoardPhoto | null, findings: DefectFinding[]) => void;
}) {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const [photo, setPhoto] = useState<BoardPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<DefectReport | null>(null);
  const [golden, setGolden] = useState<{ findings: DefectFinding[]; summary: string } | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const url = usePhotoUrl(photo?.blob);
  const reference = device.golden_references[0];

  const analyze = useCallback(
    async (p: BoardPhoto) => {
      setBusy(true);
      setErr(null);
      setReport(null);
      setGolden(null);
      try {
        const img = await loadImage(p.blob);
        const ctx = { device, lang, demoKey: p.demoKey };
        const detector = await getDefectDetector();
        const [rep, gold] = await Promise.all([
          detector.detect(img, ctx),
          reference ? compareWithGolden(img, reference, ctx).catch(() => null) : Promise.resolve(null),
        ]);
        setReport(rep);
        if (gold && gold.sameLayout !== "no") setGolden(gold);
      } catch (e) {
        setErr(e instanceof AiError && e.offline ? t("ai_offline") : `${t("ai_error")}: ${(e as Error).message}`);
      } finally {
        setBusy(false);
      }
    },
    [device, lang, reference, t],
  );

  const take = (p: BoardPhoto) => {
    setPhoto(p);
    void analyze(p);
  };

  // Findings from the defect check and from the golden comparison; the same spot found by both is shown once.
  const all: DefectFinding[] = [...(report?.findings ?? [])];
  for (const g of golden?.findings ?? []) {
    if (!all.some((f) => f.defect === g.defect && Math.abs(f.box.x - g.box.x) < 0.08 && Math.abs(f.box.y - g.box.y) < 0.08)) all.push(g);
  }
  const shown = all.filter((f) => !dismissed.includes(f.id));
  const boxes: OverlayBox[] = photo
    ? shown.map((f, i) => ({
        id: f.id,
        box: { x: f.box.x * photo.width, y: f.box.y * photo.height, w: f.box.w * photo.width, h: f.box.h * photo.height },
        label: String(i + 1),
        tone: f.confidence < 0.5 ? "unsure" : "defect",
      }))
    : [];
  const badQuality = report && report.quality !== "good";

  if (!photo)
    return (
      <div className="grid gap-3">
        <h2 className="text-2xl font-extrabold">{t("board_photo")}</h2>
        <p className="text-lg">{t("board_photo_hint")}</p>
        <Camera onCapture={async (b) => take(await normalizePhoto(b))} />
        {demo && (
          <div className="grid grid-cols-2 gap-2">
            {[DEMO_PHOTOS.tvBoard, DEMO_PHOTOS.tvBoardDead].map((d, i) => (
              <Button key={d.key} tone="ghost" onClick={async () => take({ ...(await urlToPhoto(d.url)), demoKey: d.key })}>
                ★ {t("cam_demo_photo")} {i + 1}
              </Button>
            ))}
          </div>
        )}
        <Button tone="ghost" onClick={() => onDone(null, [])}>
          {t("skip")}
        </Button>
      </div>
    );

  return (
    <div className="grid gap-3">
      <PhotoView src={url} width={photo.width} height={photo.height} boxes={boxes} />
      {busy && (
        <Card>
          <Spinner label={t("analyzing")} />
          <p className="mt-2 text-sm text-muted">{t("analyzing_note")}</p>
        </Card>
      )}
      {err && <ErrorBox message={err} onRetry={() => analyze(photo)} />}
      {badQuality && <ErrorBox message={t("image_quality_bad")} />}

      {report && !badQuality && (
        <Card>
          <h3 className="mb-2 text-lg font-bold">{t("findings_title")}</h3>
          {shown.length === 0 && <p>{t("findings_none")}</p>}
          <ol className="grid gap-2">
            {shown.map((f, i) => (
              <li key={f.id} className="flex items-start gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${f.confidence < 0.5 ? "bg-amber-400 text-black" : "bg-red-600 text-white"}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="text-lg font-semibold">{f.label}</div>
                  <div className="text-sm text-muted">
                    {Math.round(f.confidence * 100)}% {f.source === "golden" && <Pill>{t("golden_title")}</Pill>}
                  </div>
                </div>
                <Button tone="ghost" onClick={() => setDismissed([...dismissed, f.id])}>
                  {t("finding_dismiss")}
                </Button>
              </li>
            ))}
          </ol>
          {report.summary && <p className="mt-3 text-muted">{report.summary}</p>}
        </Card>
      )}

      {reference && golden && url && (
        <Card>
          <h3 className="mb-2 text-lg font-bold">{t("golden_title")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reference.image} alt="" className="w-full rounded-xl bg-white" />
              <figcaption className="text-center text-sm font-semibold text-ok">{t("golden_healthy")}</figcaption>
            </figure>
            <figure>
              <PhotoView src={url} width={photo.width} height={photo.height} boxes={boxes} />
              <figcaption className="text-center text-sm font-semibold text-bad">{t("golden_yours")}</figcaption>
            </figure>
          </div>
          <p className="mt-2">{golden.summary}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button tone="ghost" onClick={() => setPhoto(null)}>
          ↻ {t("cam_take")}
        </Button>
        <Button tone="fix" disabled={busy} onClick={() => onDone(photo, shown)}>
          {t("to_plan")} →
        </Button>
      </div>
    </div>
  );
}
