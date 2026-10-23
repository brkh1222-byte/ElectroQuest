"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type Tone = "fix" | "build" | "plain" | "ghost" | "danger" | "ok";

const TONES: Record<Tone, string> = {
  fix: "bg-fix text-white hover:brightness-110",
  build: "bg-build text-white hover:brightness-110",
  plain: "bg-ink text-white hover:bg-ink/90",
  // Secondary buttons get depth from a shadow ring, not a border; the transparent border keeps an edge in forced-colors mode.
  ghost: "bg-surface text-ink border border-transparent shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
  danger: "bg-surface text-bad border-2 border-bad",
  ok: "bg-ok text-white hover:brightness-110",
};

const SIZE = { sm: "min-h-10 px-4 text-sm", md: "min-h-12 px-5 text-base", lg: "min-h-14 px-6 text-lg" };

/** Inline icon sized to the text, stroke matched to semibold labels (2px rendered). */
export function I({ icon: Icon, className = "", stroke = 2 }: { icon: LucideIcon; className?: string; stroke?: number }) {
  return <Icon aria-hidden className={`size-[1.15em] shrink-0 ${className}`} strokeWidth={stroke} absoluteStrokeWidth />;
}

const press = "transition-[scale,box-shadow,background-color,filter] duration-150 ease-out";

export function Button({
  tone = "plain",
  size = "md",
  big,
  static: isStatic,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: keyof typeof SIZE; big?: boolean; static?: boolean }) {
  return (
    <button
      {...props}
      className={`${TONES[tone]} ${SIZE[big ? "lg" : size]} inline-flex items-center justify-center gap-2 rounded-xl font-semibold ${press} ${isStatic ? "" : "enabled:active:scale-[0.96]"} disabled:opacity-40 ${className}`}
    />
  );
}

export function LinkButton({ href, tone = "plain", size = "md", big, className = "", children }: { href: string; tone?: Tone; size?: keyof typeof SIZE; big?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${TONES[tone]} ${SIZE[big ? "lg" : size]} inline-flex items-center justify-center gap-2 rounded-xl font-semibold ${press} active:scale-[0.96] ${className}`}>
      {children}
    </Link>
  );
}

/** Surface: 28px radius = inner rounded-lg (8px) + p-5 (20px), so nested surfaces stay concentric. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] border border-transparent bg-surface ${/\bp-\d/.test(className) ? "" : "p-5"} shadow-[var(--shadow-border)] ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-lg text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
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
      <span className="h-6 w-6 animate-spin rounded-full border-4 border-line border-t-ink motion-reduce:animate-none" />
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
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium ${c}`}>{children}</span>;
}

export function Money({ mnt }: { mnt: number }) {
  return <>{mnt.toLocaleString("en-US")}₮</>;
}

export function Bar({ value, tone = "fix" }: { value: number; tone?: "fix" | "build" }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full ${tone === "fix" ? "bg-fix" : "bg-build"} transition-[width] duration-500 ease-out motion-reduce:transition-none`} style={{ width: `${Math.round(value * 100)}%` }} />
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
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white tabular-nums">{i + 1}</span>
          <span className="pt-1">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/** Modal bottom sheet on phones, centered dialog on desktop. Scroll stays inside. */
export function Sheet({ onClose, children, wide }: { onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        className={`pb-safe flex max-h-[85dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-3xl border border-transparent bg-surface p-5 shadow-[var(--shadow-raised)] sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
