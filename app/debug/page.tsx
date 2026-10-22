"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Pill, Section } from "@/components/ui";
import { ai } from "@/lib/ai-client";
import { store, useLive } from "@/lib/db";
import { getMode, modelAvailable, setMode, type DetectorMode } from "@/lib/detector";
import { useI18n } from "@/lib/i18n";

export default function DebugPage() {
  const { t, lang } = useI18n();
  const [dev, setDev] = useState(false);
  const [demo, setDemo] = useState(false);
  const [mode, setModeState] = useState<DetectorMode>("auto");
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const [ping, setPing] = useState<string>("");
  const logs = useLive(async () => (await store.all("ailog")).sort((a, b) => b.ts - a.ts).slice(0, 60), ["ailog"]);
  const cache = useLive(() => store.all("demo_cache"), ["demo_cache"]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read local flags once
      setDev(localStorage.getItem("dev") === "1");
      setDemo(localStorage.getItem("demo") === "1");
    } catch {}
    setModeState(getMode());
    void modelAvailable().then(setHasModel);
  }, []);

  const toggle = (key: "dev" | "demo", on: boolean) => {
    try {
      if (on) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
    } catch {}
    (key === "dev" ? setDev : setDemo)(on);
  };

  const exportFixture = async () => {
    const scans = (await store.all("scans")).sort((a, b) => b.createdAt - a.createdAt);
    const s = scans[0];
    if (!s) return;
    const p = s.photos[0];
    const blob = new Blob([JSON.stringify({ width: p.width, height: p.height, detections: p.detections }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fixture.json";
    a.click();
  };

  return (
    <AppShell title={t("debug")} back="/">
      <Card>
        <label className="flex min-h-12 items-center justify-between gap-3 text-lg font-semibold">
          {t("dev_mode")}
          <input type="checkbox" className="h-7 w-7" checked={dev} onChange={(e) => toggle("dev", e.target.checked)} />
        </label>
      </Card>

      {dev && (
        <>
          <Section title="Demo">
            <Card className="grid gap-2">
              <label className="flex min-h-12 items-center justify-between gap-3 text-lg">
                ?demo=1
                <input type="checkbox" className="h-7 w-7" checked={demo} onChange={(e) => toggle("demo", e.target.checked)} />
              </label>
              <div className="text-sm text-muted">Recorded Claude answers: {cache?.length ?? 0}</div>
              <div className="flex flex-wrap gap-2">
                {cache?.map((c) => (
                  <Pill key={c.key}>{c.key}</Pill>
                ))}
              </div>
              <Button tone="danger" onClick={() => store.clear("demo_cache")}>
                Clear recorded answers
              </Button>
            </Card>
          </Section>

          <Section title="Detector">
            <Card className="grid gap-2">
              <div>
                best.onnx: {hasModel === null ? "…" : hasModel ? <Pill tone="ok">found</Pill> : <Pill tone="warn">missing → mock</Pill>}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(["auto", "onnx", "remote", "mock"] as const).map((m) => (
                  <Button key={m} tone={mode === m ? "build" : "ghost"} onClick={() => { setMode(m); setModeState(m); }}>
                    {m}
                  </Button>
                ))}
              </div>
              <Button tone="ghost" onClick={exportFixture}>
                Export last scan as fixture.json
              </Button>
            </Card>
          </Section>

          <Section title="Claude">
            <Card className="grid gap-2">
              <Button
                tone="ghost"
                onClick={async () => {
                  setPing("…");
                  try {
                    const r = await ai("ping", {}, { lang });
                    setPing(r.message);
                  } catch (e) {
                    setPing(`✗ ${(e as Error).message}`);
                  }
                }}
              >
                Ping /api/ai
              </Button>
              {ping && <p>{ping}</p>}
            </Card>
          </Section>

          <Section title={`AI calls (${logs?.length ?? 0})`} right={<Button tone="ghost" onClick={() => store.clear("ailog")}>Clear</Button>}>
            <ul className="grid gap-2">
              {logs?.map((l) => (
                <li key={l.id}>
                  <details className="rounded-xl border border-line bg-surface p-2">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                      <Pill tone={l.ok ? "ok" : "bad"}>{l.task}</Pill>
                      <Pill tone={l.source === "live" ? "muted" : "warn"}>{l.source}</Pill>
                      <span className="tabular-nums">{l.ms} ms</span>
                      {l.model && <span className="text-muted">{l.model}</span>}
                      <span className="text-muted">{new Date(l.ts).toLocaleTimeString()}</span>
                    </summary>
                    <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs">IN: {l.input}{"\n\n"}OUT: {l.output}</pre>
                  </details>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Local data">
            <Button
              tone="danger"
              className="w-full"
              onClick={async () => {
                for (const s of ["inventory", "scans", "repairs", "completions", "kv"] as const) await store.clear(s);
              }}
            >
              Reset inventory, scans, repairs, progress
            </Button>
          </Section>
        </>
      )}
    </AppShell>
  );
}
