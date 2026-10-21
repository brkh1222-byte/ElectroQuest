"use client";

import type { PublicProblem, RangeSetting } from "@/lib/problems/schema";
import type { DraftSettings } from "./events";

const labels = {
  temperature: { name: "Temperature", help: "0 = always the same reply. Higher = more random." },
  maxOutputTokens: { name: "Max output tokens", help: "The model stops writing after this many tokens." },
} as const;

/** True when the learner has anything to choose besides the prompt. */
export function hasSettings(problem: PublicProblem) {
  const { temperature, maxOutputTokens } = problem.config.settings;
  return Boolean(temperature || maxOutputTokens || problem.models.length > 1);
}

/** The model name without its provider, e.g. "gemini-2.5-flash-lite". */
export function modelLabel(id: string) {
  return id.split("/").at(-1) ?? id;
}

function Slider({
  name,
  range,
  value,
  onChange,
}: {
  name: keyof typeof labels;
  range: RangeSetting;
  value: number;
  onChange: (v: number) => void;
}) {
  const step = name === "temperature" ? 0.1 : 1;
  return (
    <label className="flex items-center gap-2 text-xs" title={labels[name].help}>
      <span className="text-muted">{labels[name].name}</span>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 accent-[var(--accent)]"
      />
      <span className="w-8 font-mono tabular-nums">{name === "temperature" ? value.toFixed(1) : value}</span>
    </label>
  );
}

export function SettingsBar({
  problem,
  value,
  onChange,
}: {
  problem: PublicProblem;
  value: DraftSettings;
  onChange: (next: DraftSettings) => void;
}) {
  const { temperature, maxOutputTokens } = problem.config.settings;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-3 py-2">
      {temperature && (
        <Slider
          name="temperature"
          range={temperature}
          value={value.temperature ?? temperature.default}
          onChange={(v) => onChange({ ...value, temperature: v })}
        />
      )}
      {maxOutputTokens && (
        <Slider
          name="maxOutputTokens"
          range={maxOutputTokens}
          value={value.maxOutputTokens ?? maxOutputTokens.default}
          onChange={(v) => onChange({ ...value, maxOutputTokens: v })}
        />
      )}
      {problem.models.length > 1 && (
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted">Model</span>
          <select
            value={value.model ?? problem.models[0]}
            onChange={(e) => onChange({ ...value, model: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
          >
            {problem.models.map((m) => (
              <option key={m} value={m}>
                {modelLabel(m)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
