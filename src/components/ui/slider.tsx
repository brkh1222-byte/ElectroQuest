import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

/** A range input with a filled track. Takes the same props as <input type="range">. */
export function Slider({
  value,
  min = 0,
  max = 100,
  className,
  style,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max"> & {
  value: number;
  min?: number;
  max?: number;
}) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      className={cn("slider", className)}
      style={{ ...style, ["--fill" as string]: `${fill}%` }}
      {...props}
    />
  );
}
