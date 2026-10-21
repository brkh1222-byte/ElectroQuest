import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardTone = "default" | "accent" | "success" | "warning" | "dashed";

const tones: Record<CardTone, string> = {
  // Transparent border keeps an edge in forced-colors mode, where shadows are removed.
  default: "border border-transparent bg-surface shadow-card",
  accent: "border border-accent/40 bg-surface shadow-card",
  success: "border border-success/30 bg-success/10",
  warning: "border border-warning/40 bg-warning/10",
  dashed: "border border-dashed border-border",
};

/** Card surface. `interactive` adds the hover ring and a small lift, for cards that are links. */
export function cardClass({
  tone = "default",
  interactive = false,
  className,
}: { tone?: CardTone; interactive?: boolean; className?: string } = {}) {
  return cn(
    "rounded-xl",
    tones[tone],
    interactive &&
      "transition-[box-shadow,translate,border-color] duration-200 ease-out hover:shadow-raised motion-safe:hover:-translate-y-0.5",
    className,
  );
}

export function Card({
  tone,
  interactive,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: CardTone; interactive?: boolean }) {
  return <div className={cardClass({ tone, interactive, className })} {...props} />;
}
