"use client";

import { useEffect, useState } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { ai } from "@/lib/ai-client";
import type { TaskOutput } from "@/lib/ai-tasks";
import type { DiagnosisState, RankedCause } from "@/lib/diagnosis";
import { useI18n } from "@/lib/i18n";
import type { DeviceProfile } from "@/lib/schemas";
import { Card, I, Spinner } from "../ui";

/**
 * After the camera check: Claude turns everything gathered (answers beside the camera, test results, what it saw
 * on the board photo, our ranked causes) into one plain repair suggestion. The ranking stays ours; Claude explains
 * and orders the steps, and may only use causes and steps from the device data.
 */
export function AiAdvice({
  device,
  state,
  ranked,
  findingLabels,
  photoChecked,
}: {
  device: DeviceProfile;
  state: DiagnosisState;
  ranked: RankedCause[];
  findingLabels: { label: string; confidence: number }[];
  photoChecked: boolean;
}) {
  const { t, tr, lang } = useI18n();
  const [advice, setAdvice] = useState<TaskOutput<"repair_advice"> | null>(null);
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify([state.answers, state.tests, state.tried, findingLabels.length, lang]);
  // Hard safety rule in code, not only in the prompt: a swollen lithium battery must never be charged.
  const swollen = state.answers.swollen === "yes";

  useEffect(() => {
    let alive = true;
    const input = {
      device: tr(device.name),
      answers: device.questions.filter((q) => state.answers[q.id]).map((q) => ({ question: tr(q.text), answer: tr(q.answers.find((a) => a.id === state.answers[q.id])!.text) })),
      tests: device.tests.filter((x) => state.tests[x.id] && x.outcomes.some((o) => o.id === state.tests[x.id])).map((x) => ({ test: tr(x.title), result: tr(x.outcomes.find((o) => o.id === state.tests[x.id])!.text) })),
      photo_findings: findingLabels,
      photo_checked: photoChecked,
      causes: ranked
        .filter((r) => !state.tried.includes(r.cause.id))
        .slice(0, 3)
        .map((r) => ({ name: tr(r.cause.name), probability: Math.round(r.p * 100) / 100, why: tr(r.cause.why), fix: tr(r.cause.fix.summary), steps: r.cause.fix.steps.map(tr) })),
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the evidence changes
    setAdvice(null);
    setFailed(false);
    ai("repair_advice", input, { lang, demoKey: `${device.id}:advice` })
      .then((r) => {
        if (!alive) return;
        if (swollen) {
          const charging = /charg|цэнэглэ/i;
          r = { ...r, fix_first: t("swollen_first"), steps: r.steps.filter((x) => !charging.test(x)), safety: t("swollen_safety") };
        }
        setAdvice(r);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the evidence (key) changes
  }, [key]);

  if (failed) return null; // the plan below stands on its own without the AI summary
  return (
    <Card className="mb-4 border-2 border-build bg-teal-50/60">
      <div className="flex items-center gap-2 text-sm font-semibold text-build">
        <I icon={Sparkles} /> {t("ai_advice")}
      </div>
      {!advice ? (
        <div className="mt-3">
          <Spinner label={t("ai_advice_loading")} />
        </div>
      ) : (
        <div className="enter">
          <h2 className="mt-1 text-2xl font-extrabold leading-snug">{advice.headline}</h2>
          <p className="mt-2 text-lg">{advice.reasoning}</p>
          <p className="mt-3 font-semibold">{advice.fix_first}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            {advice.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="mt-3 text-muted">{advice.if_that_fails}</p>
          {advice.safety && (
            <p className="mt-3 flex gap-2 font-semibold text-warn">
              <I icon={TriangleAlert} className="mt-1" /> {advice.safety}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
