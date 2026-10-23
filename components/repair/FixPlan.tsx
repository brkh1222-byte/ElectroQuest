"use client";

import { useI18n } from "@/lib/i18n";
import type { Cause } from "@/lib/schemas";
import { Bullets, Card, Difficulty, Money, Pill, Section, Steps } from "../ui";

export function FixPlanCard({ cause }: { cause: Cause }) {
  const { t, tr } = useI18n();
  const f = cause.fix;
  const cost = f.parts.reduce((a, p) => a + p.price_mnt, 0);
  const saved = Math.max(0, f.shop_price_mnt - cost);
  return (
    <div>
      <Card className="border-2 border-fix">
        <div className="text-sm font-semibold text-fix">{t("fix_plan")}</div>
        <h3 className="text-2xl font-extrabold">{tr(f.summary)}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Difficulty level={f.difficulty} />
          <span className="text-muted">
            ⏱ {f.time_minutes} {t("proj_minutes")}
          </span>
          {f.needs_soldering && <Pill tone="warn">🔥 solder</Pill>}
        </div>
        {/* The selling point: what it costs you vs. a repair shop. */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-green-50 p-2">
            <div className="text-sm text-muted">{t("cost_you")}</div>
            <div className="text-2xl font-extrabold text-ok">
              <Money mnt={cost} />
            </div>
          </div>
          <div className="rounded-xl bg-bg p-2">
            <div className="text-sm text-muted">{t("cost_shop")}</div>
            <div className="text-2xl font-extrabold line-through decoration-2">
              <Money mnt={f.shop_price_mnt} />
            </div>
          </div>
          <div className="rounded-xl bg-fix p-2 text-white">
            <div className="text-sm opacity-90">{t("you_save")}</div>
            <div className="text-2xl font-extrabold">
              <Money mnt={saved} />
            </div>
          </div>
        </div>
      </Card>

      {f.parts.length > 0 && (
        <Section title={t("parts_to_get")}>
          <Card>
            <ul className="grid gap-1">
              {f.parts.map((p, i) => (
                <li key={i} className="flex justify-between gap-2 text-lg">
                  <span>{tr(p.name)}</span>
                  <b className="tabular-nums">
                    <Money mnt={p.price_mnt} />
                  </b>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      {f.tools.length > 0 && (
        <Section title={t("tools")}>
          <Card>
            <Bullets items={f.tools.map(tr)} />
          </Card>
        </Section>
      )}

      {f.no_solder_option && (
        <Card className="mt-3 border-build bg-teal-50">
          <div className="font-semibold text-build">{t("no_solder")}</div>
          <div>{tr(f.no_solder_option)}</div>
        </Card>
      )}

      <Section title={t("steps")}>
        <Card>
          <Steps items={f.steps.map(tr)} />
        </Card>
      </Section>

      {f.safety.length > 0 && (
        <Section title={t("safety")}>
          <Card className="border-warn bg-amber-50">
            <Bullets items={f.safety.map(tr)} />
          </Card>
        </Section>
      )}

      <Section title={t("give_up")}>
        <Card>{tr(f.give_up_when)}</Card>
      </Section>
    </div>
  );
}
