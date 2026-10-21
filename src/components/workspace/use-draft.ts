"use client";

import { useEffect, useState } from "react";

/** Keeps the learner's draft in localStorage so a refresh doesn't lose work. */
export function useDraft(key: string, initial: string) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (saved !== null) setValue(saved);
    } catch {}
  }, [key]);

  const update = (next: string) => {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {}
  };

  const reset = () => update(initial);

  return [value, update, reset] as const;
}
