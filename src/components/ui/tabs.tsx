"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

type TabItem<T extends string> = { value: T; label: ReactNode };

/**
 * A row of tabs with a sliding indicator. `variant="underline"` sits on a bordered toolbar;
 * `variant="pill"` is a segmented control. Arrow keys, Home and End move between tabs.
 * Give the panel `role="tabpanel"` with `id={tabPanelId(id)}` and `aria-labelledby={tabId(id, value)}`.
 */
export function Tabs<T extends string>({
  id,
  items,
  value,
  onChange,
  variant = "underline",
  label,
  className,
}: {
  id: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "underline" | "pill";
  label?: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  // Animate only after the first placement, so the indicator does not slide in on load.
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
    if (!list || !active) return;
    const place = () => setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, items]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((t) => t.value === value);
    const next =
      e.key === "ArrowRight"
        ? (index + 1) % items.length
        : e.key === "ArrowLeft"
          ? (index - 1 + items.length) % items.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? items.length - 1
              : -1;
    if (next === -1) return;
    e.preventDefault();
    onChange(items[next].value);
    listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(items[next].value)}"]`)?.focus();
  }

  const pill = variant === "pill";
  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex",
        pill ? "inline-flex rounded-lg bg-surface-2 p-0.5 ring-1 ring-border ring-inset" : "gap-1",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute",
            pill ? "inset-y-0.5 rounded-md bg-surface shadow-card" : "bottom-0 h-0.5 rounded-full bg-accent",
            ready && "motion-safe:transition-[left,width] motion-safe:duration-150 motion-safe:ease-out",
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {items.map((t) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            id={tabId(id, t.value)}
            aria-selected={selected}
            aria-controls={tabPanelId(id)}
            tabIndex={selected ? 0 : -1}
            data-value={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap transition-colors duration-150 ease-out focus-visible:outline-offset-[-2px]",
              pill ? "h-7 rounded-md px-3" : "h-11 px-3",
              selected ? "font-medium text-foreground" : "text-muted hover:text-foreground",
              // Before the indicator is measured, mark the active tab statically.
              !indicator && selected && (pill ? "rounded-md bg-surface shadow-card" : "shadow-[inset_0_-2px_0_var(--accent)]"),
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export const tabId = (id: string, value: string) => `${id}-tab-${value.replace(/\W+/g, "-")}`;
export const tabPanelId = (id: string) => `${id}-panel`;
