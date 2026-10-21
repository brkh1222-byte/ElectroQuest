"use client";

import { useEffect, useState } from "react";

export type JsonState<T> =
  | { status: "loading" }
  | { status: "error"; httpStatus: number; error: string }
  | { status: "ok"; data: T };

/** GETs JSON on mount; `reload` refetches while keeping the current data on screen. */
export function useJson<T>(url: string) {
  const [state, setState] = useState<JsonState<T>>({ status: "loading" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setState(
          res.ok
            ? { status: "ok", data }
            : { status: "error", httpStatus: res.status, error: data.error ?? `Request failed (${res.status})` },
        );
      })
      .catch(() => !cancelled && setState({ status: "error", httpStatus: 0, error: "Network error." }));
    return () => {
      cancelled = true;
    };
  }, [url, version]);

  return [state, () => setVersion((v) => v + 1)] as const;
}
