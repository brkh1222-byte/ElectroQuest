import type { LearnerSettings, ProblemConfig, RangeSetting } from "./schema";

function clamp(value: number | undefined, range: RangeSetting) {
  if (value === undefined || !Number.isFinite(value)) return range.default;
  return Math.min(range.max, Math.max(range.min, value));
}

/**
 * The generation settings a model call uses. Settings the problem exposes take the learner's
 * value (clamped to the allowed range); the rest stay fixed so everyone competes on the prompt.
 */
export function resolveSettings(config: ProblemConfig, requested: LearnerSettings = {}) {
  const { temperature, maxOutputTokens } = config.settings;
  return {
    temperature: temperature ? clamp(requested.temperature, temperature) : 0,
    maxOutputTokens: maxOutputTokens
      ? Math.round(clamp(requested.maxOutputTokens, maxOutputTokens))
      : config.limits.maxOutputTokens,
  };
}

/** Default values for the settings bar. */
export function defaultSettings(config: ProblemConfig): LearnerSettings {
  const out: LearnerSettings = {};
  if (config.settings.temperature) out.temperature = config.settings.temperature.default;
  if (config.settings.maxOutputTokens) out.maxOutputTokens = config.settings.maxOutputTokens.default;
  return out;
}
