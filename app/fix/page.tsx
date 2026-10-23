"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Battery, ChevronRight, TriangleAlert } from "lucide-react";
import { Button, Card, I } from "@/components/ui";
import { devices } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { mentionsMains } from "@/lib/safety";

export default function FixPage() {
  const { t, tr } = useI18n();
  const [other, setOther] = useState(false);
  const [text, setText] = useState("");
  const mains = text.trim().length > 2 && mentionsMains(text);
  return (
    <AppShell title={t("fix_title")}>
      <div className="grid gap-4 md:grid-cols-3">
        {devices.map((d) => (
          <Link
            key={d.id}
            href={`/fix/${d.id}`}
            className="group flex min-h-24 items-center gap-4 rounded-3xl border border-transparent bg-surface p-5 shadow-[var(--shadow-border)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96] md:min-h-56 md:flex-col md:items-start md:justify-between"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.icon} alt="" className="size-16 md:size-20" />
            <div>
              <div className="text-xl font-bold">{tr(d.name)}</div>
              <div className="mt-1 flex items-center gap-1.5 text-muted">
                <I icon={Battery} /> {tr(d.battery)}
              </div>
            </div>
            <I icon={ChevronRight} className="ms-auto text-muted md:hidden" />
          </Link>
        ))}
        <Button tone="ghost" big className="md:col-span-3 md:justify-self-start" onClick={() => setOther(!other)} aria-expanded={other}>
          {t("fix_other")} <I icon={ChevronRight} className={`transition-transform duration-150 ${other ? "rotate-90" : ""}`} />
        </Button>
        {other && (
          <Card className="md:col-span-3">
            <p className="text-lg">{t("fix_other_body")}</p>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("interview_free")}
              className="mt-3 min-h-12 w-full rounded-xl border-2 border-line px-3 text-lg"
            />
            {mains && (
              <p className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 font-bold text-bad">
                <I icon={TriangleAlert} className="mt-1" /> {t("mains_refuse")}
              </p>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
