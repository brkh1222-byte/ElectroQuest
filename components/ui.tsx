"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type Tone = "fix" | "build" | "plain" | "ghost" | "danger" | "ok";

const TONES: Record<Tone, string> = {
  fix: "bg-fix text-white",
  build: "bg-build text-white",
  plain: "bg-ink text-white",
  ghost: "bg-surface text-ink border-2 border-line",
  danger: "bg-surface text-bad border-2 border-bad",
  ok: "bg-ok text-white",
};

export function Button({
  tone = "plain",
  big,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; big?: boolean }) {
  return (
    <button
      {...props}
      className={`${TONES[tone]} ${big ? "min-h-16 text-xl" : "min-h-12 text-base"} rounded-2xl px-5 font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100 ${className}`}
    />
  );
}

export function LinkButton({ href, tone = "plain", big, className = "", children }: { href: string; tone?: Tone; big?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`${TONES[tone]} ${big ? "min-h-16 text-xl" : "min-h-12 text-base"} inline-flex items-center justify-center rounded-2xl px-5 font-semibold active:scale-[0.98] transition-transform ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-surface border border-line p-4 ${className}`}>{children}</div>;
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Difficulty({ level }: { level: number }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted" aria-label={`${t("difficulty")} ${level}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full ${i <= level ? "bg-ink" : "bg-line"}`} />
      ))}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-4 border-line border-t-ink" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border-2 border-bad bg-red-50 p-4 text-bad" role="alert">
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <Button tone="danger" className="mt-3" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "bad" | "fix" | "build" }) {
  const c = {
    muted: "bg-bg text-muted border-line",
    ok: "bg-green-50 text-ok border-ok",
    warn: "bg-amber-50 text-warn border-warn",
    bad: "bg-red-50 text-bad border-bad",
    fix: "bg-orange-50 text-fix border-fix",
    build: "bg-teal-50 text-build border-build",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium ${c}`}>{children}</span>;
}

export function Money({ mnt }: { mnt: number }) {
  return <>{mnt.toLocaleString("en-US")}₮</>;
}

export function Bar({ value, tone = "fix" }: { value: number; tone?: "fix" | "build" }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full ${tone === "fix" ? "bg-fix" : "bg-build"} transition-[width] duration-500`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white font-bold">{i + 1}</span>
          <span className="pt-1">{s}</span>
        </li>
      ))}
    </ol>
  );
}
