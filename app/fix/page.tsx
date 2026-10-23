"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card } from "@/components/ui";
import { devices } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { mentionsMains } from "@/lib/safety";

export default function FixPage() {
  const { t, tr } = useI18n();
  const [other, setOther] = useState(false);
  const [text, setText] = useState("");
  const mains = text.trim().length > 2 && mentionsMains(text);
  return (
    <AppShell title={t("fix_title")} back="/">
      <div className="grid gap-3">
        {devices.map((d) => (
          <Link key={d.id} href={`/fix/${d.id}`} className="flex min-h-24 items-center gap-4 rounded-3xl border-2 border-line bg-surface p-4 active:scale-[0.99] transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.icon} alt="" className="h-16 w-16" />
            <div>
              <div className="text-xl font-bold">{tr(d.name)}</div>
              <div className="text-muted">🔋 {tr(d.battery)}</div>
            </div>
          </Link>
        ))}
        <Button tone="ghost" big onClick={() => setOther(!other)}>
          {t("fix_other")}
        </Button>
        {other && (
          <Card>
            <p className="text-lg">{t("fix_other_body")}</p>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("interview_free")}
              className="mt-3 min-h-12 w-full rounded-xl border-2 border-line px-3 text-lg"
            />
            {mains && <p className="mt-3 rounded-xl bg-red-50 p-3 font-bold text-bad">⚠ {t("mains_refuse")}</p>}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
