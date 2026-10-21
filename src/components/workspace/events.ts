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

/** Puts a past submission's code or prompt back into the editor. */
export function loadDraft(content: string) {
  window.dispatchEvent(new CustomEvent(LOAD_DRAFT, { detail: content }));
}

export function useOnLoadDraft(handler: (content: string) => void) {
  const onEvent = useEffectEvent(handler);
  useEffect(() => {
    const listener = (e: Event) => onEvent((e as CustomEvent<string>).detail);
    window.addEventListener(LOAD_DRAFT, listener);
    return () => window.removeEventListener(LOAD_DRAFT, listener);
  }, []);
}
