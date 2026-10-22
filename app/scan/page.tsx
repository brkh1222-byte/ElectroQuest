"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ScanFlow } from "@/components/ScanFlow";
import { useI18n } from "@/lib/i18n";

export default function ScanPage() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <AppShell title={t("scan_title")} back="/projects" hideNav>
      <ScanFlow kind="parts" onDone={() => router.push("/projects?from=scan")} />
    </AppShell>
  );
}
