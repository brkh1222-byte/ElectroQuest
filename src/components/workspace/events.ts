"use client";

import { useEffect, useEffectEvent } from "react";

// The info panel and the workspace are siblings under a server component, so they talk through
// window events instead of shared state.
const SUBMITTED = "evalquest:submitted";
const LOAD_DRAFT = "evalquest:load-draft";

/** Tells the Submissions and Leaderboard tabs to refetch. */
export function notifySubmitted() {
  window.dispatchEvent(new Event(SUBMITTED));
}

export function useOnSubmitted(handler: () => void) {
  const onEvent = useEffectEvent(handler);
  useEffect(() => {
    const listener = () => onEvent();
    window.addEventListener(SUBMITTED, listener);
    return () => window.removeEventListener(SUBMITTED, listener);
  }, []);
}

export type DraftSettings = { temperature?: number; maxOutputTokens?: number; model?: string };
type Draft = { content: string; settings?: DraftSettings | null };

/** Puts a past submission's (or the answer's) code or prompt, and its settings, back into the editor. */
export function loadDraft(content: string, settings?: DraftSettings | null) {
  window.dispatchEvent(new CustomEvent<Draft>(LOAD_DRAFT, { detail: { content, settings } }));
}

export function useOnLoadDraft(handler: (content: string, settings?: DraftSettings | null) => void) {
  const onEvent = useEffectEvent(handler);
  useEffect(() => {
    const listener = (e: Event) => {
      const { content, settings } = (e as CustomEvent<Draft>).detail;
      onEvent(content, settings);
    };
    window.addEventListener(LOAD_DRAFT, listener);
    return () => window.removeEventListener(LOAD_DRAFT, listener);
  }, []);
}
