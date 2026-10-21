import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * Text inputs and textareas. The border meets 3:1 contrast; focus draws an accent border and a
 * soft ring in place of the global outline.
 */
export const fieldClass =
  "w-full rounded-lg border border-border-strong bg-surface text-foreground placeholder:text-muted " +
  "transition-[border-color,box-shadow] duration-150 ease-out hover:border-muted " +
  "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/20";

export const inputClass = cn(fieldClass, "h-9 px-3 text-sm");
export const textareaClass = cn(fieldClass, "resize-y px-3 py-2.5 font-mono text-sm leading-relaxed");

/** Small uppercase label used above fields and widget sections. */
export const labelClass = "text-xs font-medium text-muted";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select {...props} className={cn(fieldClass, "h-8 appearance-none py-0 pr-8 pl-2.5 font-mono text-xs")}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
      />
    </span>
  );
}
