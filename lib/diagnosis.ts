import type { Cause, DefectType, DeviceProfile, Effects, GuidedTest, Question } from "./schemas";

/**
 * Repair-technician engine: ask → look → test → decide.
 * The device JSON (not the model) decides which question comes next and how each answer moves the
 * scores. Each cause starts at its frequency (prior) and is multiplied by the effects of every answer,
 * test outcome and visual finding — a naive-Bayes style update. Claude only rephrases and maps
 * free-text answers to one of the listed options.
 */

export interface VisualFinding {
  defect: DefectType;
  /** 0..1 */
  confidence: number;
}

export interface DiagnosisState {
  answers: Record<string, string>;
  tests: Record<string, string>;
  findings: VisualFinding[];
  /** Causes whose fix was tried and didn't work. */
  tried: string[];
}

export const emptyState = (): DiagnosisState => ({ answers: {}, tests: {}, findings: [], tried: [] });

export interface RankedCause {
  cause: Cause;
  /** Normalised probability 0..1 */
  p: number;
}

function applyEffects(scores: Map<string, number>, effects: Effects, strength = 1) {
  for (const [id, mult] of Object.entries(effects)) {
    const cur = scores.get(id);
    if (cur !== undefined) scores.set(id, cur * Math.pow(mult, strength));
  }
}

function askIfOk(askIf: Record<string, string[]> | undefined, answers: Record<string, string>) {
  if (!askIf) return true;
  return Object.entries(askIf).every(([q, allowed]) => answers[q] !== undefined && allowed.includes(answers[q]));
}

/**
 * One piece of evidence per defect type: corrosion seen on two springs (or by both the defect check and
 * the golden comparison) is still one observation, so only its most confident instance counts.
 */
function strongestPerDefect(findings: VisualFinding[]): VisualFinding[] {
  const best = new Map<string, VisualFinding>();
  for (const f of findings) if (!best.has(f.defect) || best.get(f.defect)!.confidence < f.confidence) best.set(f.defect, f);
  return [...best.values()];
}

export function rank(profile: DeviceProfile, state: DiagnosisState): RankedCause[] {
  const scores = new Map(profile.causes.map((c) => [c.id, c.frequency]));
  for (const q of profile.questions) {
    const a = q.answers.find((x) => x.id === state.answers[q.id]);
    if (a) applyEffects(scores, a.effects);
  }
  for (const t of profile.tests) {
    const o = t.outcomes.find((x) => x.id === state.tests[t.id]);
    if (o) applyEffects(scores, o.effects);
  }
  for (const f of strongestPerDefect(state.findings)) {
    const check = profile.visual_checks.find((v) => v.defect === f.defect);
    // A finding the model is unsure of moves the scores less.
    if (check) applyEffects(scores, check.effects, Math.max(0, Math.min(1, f.confidence)));
  }
  for (const id of state.tried) scores.set(id, 0);

  const total = [...scores.values()].reduce((a, b) => a + b, 0);
  return profile.causes
    .map((cause) => ({ cause, p: total > 0 ? scores.get(cause.id)! / total : 0 }))
    .sort((a, b) => b.p - a.p);
}

export function nextQuestion(profile: DeviceProfile, state: DiagnosisState): Question | null {
  return profile.questions.find((q) => state.answers[q.id] === undefined && askIfOk(q.ask_if, state.answers)) ?? null;
}

/** Questions that can be asked right now, answered or not, in file order (the chips beside the camera). */
export function askableQuestions(profile: DeviceProfile, state: DiagnosisState): Question[] {
  return profile.questions.filter((q) => askIfOk(q.ask_if, state.answers));
}

/** Tests that can be run right now, done or not. */
export function askableTests(profile: DeviceProfile, state: DiagnosisState): GuidedTest[] {
  return profile.tests.filter((t) => askIfOk(t.ask_if, state.answers));
}

export function pendingTests(profile: DeviceProfile, state: DiagnosisState): GuidedTest[] {
  return askableTests(profile, state).filter((t) => state.tests[t.id] === undefined);
}

/**
 * Whether a question is asked on its own screen before the camera opens. Everything else is asked
 * beside the live camera, in any order, so it has to make sense without a fixed sequence.
 */
export function isPreCamera(profile: DeviceProfile, question: Question): boolean {
  // TODO: the first question for now. Alternative: any question that another question's or test's ask_if
  // refers to, which finds the gating question without relying on file order.
  return profile.questions[0]?.id === question.id;
}

/** The next pre-camera question still to answer, or null when the camera screen can open. */
export function nextPreCameraQuestion(profile: DeviceProfile, state: DiagnosisState): Question | null {
  return askableQuestions(profile, state).find((q) => isPreCamera(profile, q) && state.answers[q.id] === undefined) ?? null;
}

/**
 * Record (or change) an answer. Chips can be re-tapped in any order, so answers and test results whose
 * ask_if no longer holds are dropped: switching `response` away from "some" removes `pad_feel`.
 */
export function setAnswer(profile: DeviceProfile, state: DiagnosisState, questionId: string, answerId: string): DiagnosisState {
  const answers = { ...state.answers, [questionId]: answerId };
  // Dropping one answer can invalidate a question that depended on it, so repeat until nothing changes.
  for (let changed = true; changed; ) {
    changed = false;
    for (const q of profile.questions) {
      if (answers[q.id] !== undefined && !askIfOk(q.ask_if, answers)) {
        delete answers[q.id];
        changed = true;
      }
    }
  }
  const tests = Object.fromEntries(Object.entries(state.tests).filter(([id]) => askIfOk(profile.tests.find((t) => t.id === id)?.ask_if, answers)));
  return { ...state, answers, tests };
}

/** Top candidates still worth trying (fix not yet tried, non-zero probability). */
export function remaining(profile: DeviceProfile, state: DiagnosisState): RankedCause[] {
  return rank(profile, state).filter((r) => r.p > 0.001 && !state.tried.includes(r.cause.id));
}

/** Compare a multimeter reading with the expected range for the chosen battery. */
export function judgeVoltage(volts: number, range: { min: number; max: number }): "ok" | "low" | "high" {
  if (volts < range.min) return "low";
  if (volts > range.max * 1.15) return "high"; // probably the wrong battery option or wrong range on the meter
  return "ok";
}

export interface Evidence {
  /** Bilingual text of the answer / test outcome / visual finding. */
  text: { mn: string; en: string };
  kind: "answer" | "test" | "finding";
  /** How strongly it pointed at the cause (>1 = toward). */
  weight: number;
}

/** The answers, tests and findings that pushed this cause up, strongest first ("why we think this"). */
export function evidenceFor(profile: DeviceProfile, state: DiagnosisState, causeId: string): Evidence[] {
  const out: Evidence[] = [];
  for (const q of profile.questions) {
    const a = q.answers.find((x) => x.id === state.answers[q.id]);
    const w = a?.effects[causeId];
    if (a && w && w > 1) out.push({ kind: "answer", text: { mn: `${q.text.mn} → ${a.text.mn}`, en: `${q.text.en} → ${a.text.en}` }, weight: w });
  }
  for (const t of profile.tests) {
    const o = t.outcomes.find((x) => x.id === state.tests[t.id]);
    const w = o?.effects[causeId];
    if (o && w && w > 1) out.push({ kind: "test", text: { mn: `${t.title.mn}: ${o.text.mn}`, en: `${t.title.en}: ${o.text.en}` }, weight: w });
  }
  for (const f of strongestPerDefect(state.findings)) {
    const v = profile.visual_checks.find((x) => x.defect === f.defect);
    const w = v?.effects[causeId];
    if (v && w && w > 1) out.push({ kind: "finding", text: { mn: v.where.mn, en: v.where.en }, weight: Math.pow(w, f.confidence) });
  }
  return out.sort((a, b) => b.weight - a.weight);
}
