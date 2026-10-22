"use client";

import { useEffect, useState } from "react";

/**
 * Demo mode (?demo=1): demo photos are offered next to the camera, detections come from recorded
 * fixtures, and every scripted Claude call is recorded once and replayed if Claude/Wi-Fi fails.
 * ?demo=0 turns it off. The flag sticks in localStorage so a page reload on stage keeps it.
 */
export function isDemo(): boolean {
  try {
    return localStorage.getItem("demo") === "1";
  } catch {
    return false;
  }
}

export function syncDemoFromUrl() {
  try {
    const p = new URLSearchParams(window.location.search).get("demo");
    if (p === "1") localStorage.setItem("demo", "1");
    if (p === "0") localStorage.removeItem("demo");
  } catch {}
}

export function useDemo(): boolean {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    syncDemoFromUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored flag once after hydration
    setDemo(isDemo());
  }, []);
  return demo;
}

export function isDev(): boolean {
  try {
    return localStorage.getItem("dev") === "1";
  } catch {
    return false;
  }
}

export const DEMO_PHOTOS = {
  partsPile: { url: "/demo/parts-pile.svg", key: "parts-pile" },
  tvBoard: { url: "/demo/tv-board.svg", key: "tv-board" },
  tvBoardDead: { url: "/demo/tv-board-dead.svg", key: "tv-board-dead" },
} as const;
