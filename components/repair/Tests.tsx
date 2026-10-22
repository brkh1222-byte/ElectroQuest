"use client";

import { useState } from "react";
import { ai, AiError } from "@/lib/ai-client";
import { isDemo } from "@/lib/demo";
import { judgeVoltage } from "@/lib/diagnosis";
import { useI18n } from "@/lib/i18n";
import { loadImage, normalizePhoto, toDataUrl } from "@/lib/image";
import type { GuidedTest } from "@/lib/schemas";
import { Camera } from "../Camera";
import { Button, Card, ErrorBox, Spinner, Steps } from "../ui";

export function TestCard({ test, onOutcome }: { test: GuidedTest; onOutcome: (outcomeId: string) => void }) {
  const { tr, t } = useI18n();
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl font-extrabold">{tr(test.title)}</h2>
      <Card>
        <Steps items={test.instructions.map(tr)} />
      </Card>
      {test.kind === "ir_camera" && <IrCamera />}
      {test.kind === "multimeter_battery" ? (
        <Multimeter test={test} onOutcome={onOutcome} />
      ) : (
        <div className="grid gap-2">
          {test.outcomes.map((o) => (
            <Button key={o.id} big tone={o.id === "skip" || o.id === "none" || o.id === "cant_try" ? "ghost" : "plain"} onClick={() => onOutcome(o.id)}>
              {tr(o.text)}
            </Button>
          ))}
        </div>
      )}
      {test.kind !== "multimeter_battery" && !test.outcomes.some((o) => ["skip", "none", "cant_try"].includes(o.id)) && (
        <Button tone="ghost" onClick={() => onOutcome("_skip")}>
          {t("skip")}
        </Button>
      )}
    </div>
  );
}

/** Live camera inside the app: IR LEDs show up as a purple flash on most phone cameras. */
function IrCamera() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button big tone="fix" onClick={() => setOpen(true)}>
        📷 {t("ir_open_camera")}
      </Button>
    );
  return <Camera facing="user" allowFlip />;
}

function ProbeDiagram() {
  return (
    <svg viewBox="0 0 320 150" className="w-full max-w-sm" role="img" aria-label="probes">
      <rect x="90" y="50" width="140" height="56" rx="10" fill="#1f2937" />
      <rect x="230" y="66" width="12" height="24" rx="3" fill="#9ca3af" />
      <text x="160" y="86" fontSize="22" fontWeight="800" fill="#facc15" textAnchor="middle">
        1.5V
      </text>
      <text x="252" y="58" fontSize="22" fontWeight="800" fill="#dc2626">+</text>
      <text x="70" y="58" fontSize="22" fontWeight="800" fill="#111">−</text>
      <path d="M244 78 C 280 78, 290 30, 310 20" stroke="#dc2626" strokeWidth="6" fill="none" />
      <path d="M90 78 C 50 78, 30 30, 10 20" stroke="#111" strokeWidth="6" fill="none" />
    </svg>
  );
}

function Multimeter({ test, onOutcome }: { test: GuidedTest; onOutcome: (id: string) => void }) {
  const { t, tr, lang } = useI18n();
  const [opt, setOpt] = useState(test.battery_options.length === 1 ? test.battery_options[0].id : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reading, setReading] = useState<{ volts: number; text: string; notDc: boolean } | null>(null);
  const [manual, setManual] = useState("");
  const range = test.battery_options.find((o) => o.id === opt)?.volts;
  const verdict = reading && range ? judgeVoltage(reading.volts, range) : null;

  const read = async (blob: Blob) => {
    setBusy(true);
    setErr(null);
    try {
      const img = await loadImage((await normalizePhoto(blob, 1280)).blob);
      const r = await ai("read_multimeter", { image: toDataUrl(img, 1280) }, { lang, demoKey: isDemo() ? "tv-board:multimeter" : undefined });
      if (r.value === null) throw new Error(r.display_text || "?");
      const volts = r.unit === "mV" ? r.value / 1000 : r.value;
      setReading({ volts, text: r.display_text, notDc: r.is_dc_volts_mode === "no" });
    } catch (e) {
      setErr(e instanceof AiError && e.offline ? t("ai_offline") : `${t("ai_error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-2 font-semibold">{t("mm_pick_battery")}</div>
        <div className="grid gap-2">
          {test.battery_options.map((o) => (
            <Button key={o.id} tone={opt === o.id ? "build" : "ghost"} onClick={() => setOpt(o.id)}>
              {tr(o.label)} · {t("mm_expected")} {o.volts.min}–{o.volts.max}V
            </Button>
          ))}
        </div>
      </div>
      <Card className="flex flex-col items-center">
        <ProbeDiagram />
        <p className="font-semibold">{t("mm_probe_hint")}</p>
      </Card>
      {opt && !reading && (
        <>
          <Camera onCapture={read} captureLabel={t("mm_photo")} busy={busy} />
          {busy && <Spinner label={t("scan_reading")} />}
          {err && <ErrorBox message={err} />}
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder={t("mm_manual")}
              className="min-h-12 flex-1 rounded-xl border-2 border-line px-3 text-lg"
            />
            <Button tone="plain" disabled={!Number(manual.replace(",", "."))} onClick={() => setReading({ volts: Number(manual.replace(",", ".")), text: manual, notDc: false })}>
              {t("save")}
            </Button>
          </div>
        </>
      )}
      {reading && verdict && (
        <Card className={verdict === "ok" ? "border-ok bg-green-50" : "border-warn bg-amber-50"}>
          <div className="text-sm text-muted">{t("mm_reading")}</div>
          <div className="text-4xl font-extrabold tabular-nums">{reading.volts.toFixed(2)} V</div>
          <div className="mt-1 text-lg font-semibold">{t(verdict === "ok" ? "mm_result_ok" : verdict === "low" ? "mm_result_low" : "mm_result_high")}</div>
          {reading.notDc && <div className="mt-1 text-warn">{t("mm_not_dc")}</div>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button tone="ghost" onClick={() => setReading(null)}>
              ↻ {t("retry")}
            </Button>
            <Button tone="plain" onClick={() => onOutcome(verdict === "low" ? "low" : verdict === "ok" ? "ok" : "skip")}>
              {t("next")} →
            </Button>
          </div>
        </Card>
      )}
      <Button tone="ghost" onClick={() => onOutcome("skip")}>
        {tr(test.outcomes.find((o) => o.id === "skip")!.text)}
      </Button>
    </div>
  );
}
