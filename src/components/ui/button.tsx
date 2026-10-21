import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none " +
  "transition-[background-color,color,box-shadow,scale] duration-150 ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

/** Press feedback: scale to 0.96, never while disabled, only when motion is allowed. */
const press = "motion-safe:not-disabled:active:scale-[0.96]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground shadow-card hover:bg-accent-hover",
  secondary: "border border-transparent bg-surface text-foreground shadow-card hover:shadow-card-hover hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

/**
 * Button styling for <button>, <Link> and <a>. `static` turns off the press scale.
 * Put an icon after the label with `trailing` to get optically balanced padding.
 */
export function buttonClass({
  variant = "primary",
  size = "md",
  static: isStatic = false,
  block = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; static?: boolean; block?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], !isStatic && press, block && "w-full", className);
}

export function Button({
  variant,
  size,
  static: isStatic,
  block,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  static?: boolean;
  block?: boolean;
}) {
  return <button type={type} className={buttonClass({ variant, size, static: isStatic, block, className })} {...props} />;
}
