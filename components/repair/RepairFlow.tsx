"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ai, AiError } from "@/lib/ai-client";
import { deviceById, recipes } from "@/lib/data";
import { store, uid } from "@/lib/db";
import type { DefectFinding } from "@/lib/defects";
import { emptyState, evidenceFor, nextQuestion, pendingTests, rank, remaining, type DiagnosisState } from "@/lib/diagnosis";
import { useI18n } from "@/lib/i18n";
import { matchAll } from "@/lib/matcher";
import { itemLabel } from "@/lib/parts-ui";
import { mentionsMains } from "@/lib/safety";
import type { DefectType, InventoryItem, Question } from "@/lib/schemas";
import { AppShell } from "../AppShell";
import { AskSheet } from "../AskSheet";
import { RecipeCard } from "../RecipeCard";
import { ScanFlow } from "../ScanFlow";
import { ArrowLeft, ArrowRight, Camera, Check, MessageCircle, PartyPopper, Recycle, TriangleAlert, X } from "lucide-react";
import { Bar, Button, Card, ErrorBox, I, Pill, Section, Spinner, Steps } from "../ui";
import { BoardInspect, type BoardPhoto } from "./BoardInspect";
import { FixPlanCard } from "./FixPlan";
import { TestCard } from "./Tests";

type Phase = "interview" | "tests" | "open" | "inspect" | "plan" | "fixed" | "salvage" | "salvaged" | "mains";

const PHASES: { id: Phase; key: "phase_interview" | "phase_tests" | "phase_open" | "phase_findings" | "phase_plan" }[] = [
  { id: "interview", key: "phase_interview" },
  { id: "tests", key: "phase_tests" },
  { id: "open", key: "phase_open" },
  { id: "inspect", key: "phase_findings" },
  { id: "plan", key: "phase_plan" },
];

export function RepairFlow({ deviceId }: { deviceId: string }) {
  const { t, tr, lang } = useI18n();
  const device = deviceById(deviceId)!;
  const [repairId] = useState(uid);
  const [startedAt] = useState(() => Date.now());
  const [phase, setPhase] = useState<Phase>("interview");
  const [state, setState] = useState<DiagnosisState>(emptyState);
  const [history, setHistory] = useState<DiagnosisState[]>([]);
  const [board, setBoard] = useState<BoardPhoto | null>(null);
  const [asking, setAsking] = useState(false);
  const [salvaged, setSalvaged] = useState<{ before: Set<string>; items: InventoryItem[] } | null>(null);

  // Persist every change so a reload (or a crash on stage) keeps the repair.
  const outcome = phase === "fixed" ? "fixed" : phase === "salvaged" ? "salvaged" : "in_progress";
  useEffect(() => {
    void store.put("repairs", {
      id: repairId,
      deviceId,
      startedAt,
      outcome,
      state,
      causeId: rank(device, state)[0]?.cause.id,
      ...(outcome !== "in_progress" ? { finishedAt: Date.now() } : {}),
    });
  }, [repairId, deviceId, startedAt, outcome, state, device]);

  const update = (fn: (s: DiagnosisState) => DiagnosisState) => {
    setHistory((h) => [...h, state]);
    setState(fn(state));
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory(history.slice(0, -1));
    setState(prev);
    if (phase !== "interview" && nextQuestion(device, prev)) setPhase("interview");
  };

  const ranked = useMemo(() => rank(device, state), [device, state]);
  const left = useMemo(() => remaining(device, state), [device, state]);
  const question = nextQuestion(device, state);
  const tests = pendingTests(device, state);
  const top = left[0];

  // Auto-advance between phases when a phase runs out of work.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- phase follows from the diagnosis state
    if (phase === "interview" && !question) setPhase(tests.length ? "tests" : "open");
    else if (phase === "tests" && !tests.length) setPhase("open");
  }, [phase, question, tests.length]);

  const header = (
    <div className="mb-4 flex gap-1">
      {PHASES.map((p) => {
        const idx = PHASES.findIndex((x) => x.id === phase);
        const me = PHASES.findIndex((x) => x.id === p.id);
        return (
          <div key={p.id} className="flex-1">
            <div className={`h-2 rounded-full ${idx >= me || idx === -1 ? "bg-fix" : "bg-line"}`} />
            <div className={`mt-1 text-center text-xs font-semibold ${idx === me ? "text-ink" : "text-muted"}`}>{t(p.key)}</div>
          </div>
        );
      })}
    </div>
  );

  const decision = top && !top.cause.unfixable && (
    <Card className="mt-6 border-2 border-ink lg:mt-0">
                <p className="mb-3 text-xl font-bold">{t("did_it_work")}</p>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  <Button big tone="ok" onClick={() => setPhase("fixed")}>
                    <I icon={Check} /> {t("worked_yes")}
                  </Button>
                  <Button big tone="ghost" onClick={() => update((s) => ({ ...s, tried: [...s.tried, top.cause.id] }))}>
                    <I icon={X} /> {t("worked_no")}
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
                  <Button tone="ghost" onClick={() => setAsking(true)}>
                    <I icon={MessageCircle} /> {t("ask_repair")}
                  </Button>
                  <Button tone="ghost" onClick={() => setPhase("salvage")}>
                    <I icon={Recycle} /> {t("go_salvage")}
                  </Button>
                </div>
              </Card>
  );

  const candidates = (
    <Card>
      <h2 className="font-bold">{t("candidates")}</h2>
      <ul className="mt-3 grid gap-3">
        {ranked.slice(0, 5).map((r) => (
          <li key={r.cause.id} className={state.tried.includes(r.cause.id) ? "line-through opacity-50" : ""}>
            <div className="flex justify-between gap-2 text-sm">
              <span>{tr(r.cause.name)}</span>
              <span className="tabular-nums">{Math.round(r.p * 100)}%</span>
            </div>
            <Bar value={r.p} />
          </li>
        ))}
      </ul>
    </Card>
  );

  return (
    <AppShell title={tr(device.name)} back="/fix" hideNav>
      {!["fixed", "salvaged", "mains", "salvage"].includes(phase) && header}
      <div className={["interview", "tests", "open", "plan"].includes(phase) ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]" : ""}>
      <div className="min-w-0">

      {phase === "interview" && question && (
        <>
          <Interview
            key={question.id}
            question={question}
            onAnswer={(a) => update((s) => ({ ...s, answers: { ...s.answers, [question.id]: a } }))}
            onMains={() => setPhase("mains")}
          />
          {history.length > 0 && (
            <Button tone="ghost" className="mt-3 w-full" onClick={undo}>
              <I icon={ArrowLeft} /> {t("back")}
            </Button>
          )}
        </>
      )}

      {phase === "tests" && tests[0] && (
        <>
          <p className="mb-3 text-lg text-muted">{t("tests_title")}</p>
          <TestCard key={tests[0].id} test={tests[0]} onOutcome={(o) => update((s) => ({ ...s, tests: { ...s.tests, [tests[0].id]: o } }))} />
        </>
      )}

      {phase === "open" && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-extrabold">{t("open_title")}</h2>
          <Card>
            <Steps items={device.open_guide.map(tr)} />
          </Card>
          <Button big tone="fix" onClick={() => setPhase("inspect")}>
            {t("open_done")}
          </Button>
          <Button tone="ghost" onClick={() => setPhase("plan")}>
            {t("open_skip")}
          </Button>
        </div>
      )}

      {phase === "inspect" && (
        <BoardInspect
          device={device}
          onDone={(photo, findings: DefectFinding[]) => {
            setBoard(photo);
            update((s) => ({
              ...s,
              findings: findings.filter((f) => f.defect !== "other").map((f) => ({ defect: f.defect as DefectType, confidence: f.confidence })),
            }));
            setPhase("plan");
          }}
        />
      )}

      {phase === "plan" && (
        <div>
          {!top || top.cause.unfixable ? (
            <Card className="border-2 border-fix">
              <h2 className="text-2xl font-extrabold">{top ? tr(top.cause.name) : t("unfixable")}</h2>
              {top && <p className="mt-2 text-lg">{tr(top.cause.why)}</p>}
              {top && <p className="mt-2">{tr(top.cause.fix.summary)}</p>}
              <Button big tone="fix" className="mt-4 w-full" onClick={() => setPhase("salvage")}>
                <I icon={Recycle} /> {t("go_salvage")}
              </Button>
            </Card>
          ) : (
            <>
              <Card>
                <div className="text-sm font-semibold text-muted">{t("likely_cause")}</div>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-extrabold">{tr(top.cause.name)}</h2>
                  <Pill tone="fix">{Math.round(top.p * 100)}%</Pill>
                </div>
                <p className="mt-2 text-lg">
                  <b>{t("why_we_think")}:</b> {tr(top.cause.why)}
                </p>
                <Evidence deviceId={deviceId} state={state} causeId={top.cause.id} />
                {left[1] && (
                  <p className="mt-3 text-muted">
                    {t("next_likely")}: {tr(left[1].cause.name)} ({Math.round(left[1].p * 100)}%)
                  </p>
                )}
              </Card>
              <div className="mt-4">
                <FixPlanCard cause={top.cause} />
              </div>
              <div className="lg:hidden">{decision}</div>
            </>
          )}
        </div>
      )}

      {phase === "fixed" && (
        <div className="enter mx-auto grid max-w-md gap-4 text-center">
          <PartyPopper aria-hidden className="mx-auto size-16 text-fix" strokeWidth={2} absoluteStrokeWidth />
          <h2 className="text-3xl font-extrabold">{t("repaired")}</h2>
          {top && <p className="text-lg">{tr(top.cause.fix.summary)}</p>}
          <Link href="/progress" className="min-h-14 rounded-2xl bg-fix p-4 text-xl font-bold text-white transition-[scale] duration-150 ease-out active:scale-[0.96]">
            {t("nav_progress")}
          </Link>
          <Link href="/" className="min-h-14 rounded-2xl border border-transparent bg-surface p-4 text-xl font-bold shadow-[var(--shadow-border)] transition-[scale] duration-150 ease-out active:scale-[0.96]">
            {t("nav_home")}
          </Link>
        </div>
      )}

      {phase === "salvage" && (
        <SalvageStep
          deviceName={tr(device.name)}
          board={board}
          expected={device.salvage.map((s) => `${itemLabel(s.part_type, s.spec, lang)} — ${tr(s.note)}`)}
          onDone={async (items) => {
            const before = new Set(matchAll(recipes, (await store.all("inventory")).filter((i) => !items.some((x) => x.id === i.id))).ready.map((m) => m.recipe.id));
            setSalvaged({ before, items });
            setPhase("salvaged");
          }}
        />
      )}

      {phase === "salvaged" && salvaged && <SalvageResult before={salvaged.before} />}

      {phase === "mains" && (
        <Card className="border-2 border-bad bg-red-50">
          <p className="flex gap-2 text-xl font-bold text-bad">
            <I icon={TriangleAlert} className="mt-1" /> {t("mains_refuse")}
          </p>
          <Link href="/fix" className="mt-4 inline-block font-semibold underline">
            {t("back")}
          </Link>
        </Card>
      )}

      </div>
      {["interview", "tests", "open", "plan"].includes(phase) && (
        <aside className="grid gap-4 lg:sticky lg:top-8 lg:self-start">
          {phase === "plan" && <div className="hidden lg:block">{decision}</div>}
          {candidates}
        </aside>
      )}
      </div>

      {asking && top && (
        <AskSheet title={t("ask_repair")} contextKind="repair" context={{ device: device.name, cause: top.cause.name, why: top.cause.why, fix: top.cause.fix }} onClose={() => setAsking(false)} />
      )}
    </AppShell>
  );
}

function Evidence({ deviceId, state, causeId }: { deviceId: string; state: DiagnosisState; causeId: string }) {
  const { t, tr } = useI18n();
  const ev = evidenceFor(deviceById(deviceId)!, state, causeId).slice(0, 3);
  if (!ev.length) return null;
  return (
    <div className="mt-3">
      <div className="text-sm font-semibold text-muted">{t("evidence")}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {ev.map((e, i) => (
          <li key={i}>
            {e.kind === "finding" && <I icon={Camera} className="me-1 inline align-[-0.15em] text-muted" />}
            {tr(e.text)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One interview question. The device JSON decides what's next; Claude only maps free text to an option. */
function Interview({ question, onAnswer, onMains }: { question: Question; onAnswer: (id: string) => void; onMains: () => void }) {
  const { t, tr, lang } = useI18n();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [guess, setGuess] = useState<{ id: string; reply: string } | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const interpret = async () => {
    if (mentionsMains(text)) return onMains();
    setBusy(true);
    setErr(null);
    setGuess(null);
    setReply(null);
    abort.current = new AbortController();
    try {
      const r = await ai(
        "interpret_answer",
        { question: tr(question.text), options: question.answers.map((a) => ({ id: a.id, text: tr(a.text) })), user_text: text },
        { lang, signal: abort.current.signal },
      );
      if (r.mentions_mains_power) return onMains();
      if (r.option_id && question.answers.some((a) => a.id === r.option_id)) setGuess({ id: r.option_id, reply: r.reply });
      else setReply(r.reply);
    } catch (e) {
      setErr(e instanceof AiError && e.offline ? t("ai_offline") : `${t("ai_error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <h2 className="text-2xl font-extrabold leading-snug">{tr(question.text)}</h2>
      <div className="grid gap-2">
        {question.answers.map((a) => (
          <Button key={a.id} big tone="ghost" className="text-left" onClick={() => onAnswer(a.id)}>
            {tr(a.text)}
          </Button>
        ))}
      </div>
      <Section title={t("interview_free")}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void interpret();
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} className="min-h-12 flex-1 rounded-xl border-2 border-line px-3 text-lg" />
          <Button tone="plain" disabled={!text.trim() || busy}>
            {t("interview_free_send")}
          </Button>
        </form>
        {busy && <div className="mt-2"><Spinner /></div>}
        {err && <div className="mt-2"><ErrorBox message={err} onRetry={interpret} /></div>}
        {reply && <p className="mt-2 text-lg">{reply}</p>}
        {guess && (
          <Card className="mt-2 border-2 border-build">
            <p className="font-semibold">{t("interview_did_you_mean")}</p>
            <p className="text-xl">{tr(question.answers.find((a) => a.id === guess.id)!.text)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button tone="build" onClick={() => onAnswer(guess.id)}>
                {t("yes")}
              </Button>
              <Button tone="ghost" onClick={() => setGuess(null)}>
                {t("no")}
              </Button>
            </div>
          </Card>
        )}
      </Section>
    </div>
  );
}

function SalvageStep({ deviceName, board, expected, onDone }: { deviceName: string; board: BoardPhoto | null; expected: string[]; onDone: (items: InventoryItem[]) => void }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3">
      <h2 className="flex items-center gap-2 text-2xl font-extrabold">
        <I icon={Recycle} className="text-fix" /> {t("salvage_title")}
      </h2>
      <p className="text-lg">{t("salvage_intro")}</p>
      <Card>
        <div className="mb-1 text-sm font-semibold text-muted">{t("salvage_expect")}</div>
        <ul className="list-disc space-y-1 pl-5">
          {expected.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </Card>
      <ScanFlow kind="salvage" from={`${t("salvage_from")} ${deviceName}`} initialPhoto={board ?? undefined} onDone={(items) => onDone(items)} />
    </div>
  );
}

/** After salvage: show what became buildable (or nearly) thanks to the new parts. */
function SalvageResult({ before }: { before: Set<string> }) {
  const { t } = useI18n();
  const [res, setRes] = useState<ReturnType<typeof matchAll> | null>(null);
  useEffect(() => {
    void store.all("inventory").then((inv) => setRes(matchAll(recipes, inv)));
  }, []);
  if (!res) return <Spinner />;
  const fresh = res.ready.filter((m) => !before.has(m.recipe.id));
  return (
    <div className="grid gap-4">
      <Recycle aria-hidden className="mx-auto size-14 text-build" strokeWidth={2} absoluteStrokeWidth />
      <h2 className="text-center text-2xl font-extrabold">{t("scan_added")}</h2>
      {fresh.length > 0 && <p className="text-lg font-semibold text-build">{t("proj_new_from_salvage")}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {[...fresh, ...res.missing1].slice(0, 4).map((m) => (
          <RecipeCard key={m.recipe.id} m={m} />
        ))}
      </div>
      <Link href="/projects" className="min-h-14 rounded-2xl bg-build p-4 text-center text-xl font-bold text-white transition-[scale] duration-150 ease-out active:scale-[0.96]">
        {t("nav_projects")} <I icon={ArrowRight} className="inline" />
      </Link>
    </div>
  );
}
