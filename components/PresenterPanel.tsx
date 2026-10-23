"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { store } from "@/lib/db";
import { I } from "./ui";

/**
 * Presenter mode for the live pitch: open any page with ?present=1 (?present=0 hides it, the P key toggles).
 * Shows the 8-minute run of show with a timer and resets the demo data, keeping recorded Claude answers.
 */
const BEATS: { at: string; label: string; href?: string }[] = [
  { at: "0:00", label: "Problem + solution slides" },
  { at: "1:30", label: "Switch to the app", href: "/?demo=1" },
  { at: "1:45", label: "Fix → TV remote: 4 answers, point at the ranking", href: "/fix/tv_remote" },
  { at: "2:30", label: "IR test with a real remote → No flash, skip multimeter" },
  { at: "3:00", label: "Opened board → demo photo 1 → findings" },
  { at: "3:45", label: "See diagnosis → 500₮ vs 15,000₮ → It works!" },
  { at: "4:15", label: "Second remote → demo photo 2 → salvage → add", href: "/fix/tv_remote" },
  { at: "5:00", label: "Scan → demo photo → read values → add", href: "/scan" },
  { at: "5:45", label: "Night light → Start building → 1–2 steps", href: "/projects/night-light" },
  { at: "6:30", label: "Pre-built night light: lights off" },
  { at: "6:50", label: "Model card + impact", href: "/model-card" },
  { at: "7:30", label: "Close with the link" },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function PresenterPanel() {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(true);
  const [done, setDone] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search).get("present");
      if (p === "1") localStorage.setItem("present", "1");
      if (p === "0") localStorage.removeItem("present");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored flag once after hydration
      setOn(localStorage.getItem("present") === "1");
    } catch {}
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "p" || (e.target as HTMLElement)?.closest("input,textarea")) return;
      setOn((v) => {
        try {
          if (v) localStorage.removeItem("present");
          else localStorage.setItem("present", "1");
        } catch {}
        return !v;
      });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!on) return null;
  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const over = elapsed > 8 * 60;

  const reset = async () => {
    setResetting(true);
    for (const s of ["inventory", "scans", "repairs", "completions"] as const) await store.clear(s);
    try {
      localStorage.setItem("demo", "1");
    } catch {}
    setDone([]);
    setResetting(false);
  };

  return (
    <div className="fixed bottom-20 right-3 z-50 w-80 rounded-[28px] border border-transparent bg-ink text-white shadow-[var(--shadow-raised)] lg:bottom-4 lg:right-4">
      <div className="flex items-center gap-2 p-3 ps-4">
        <I icon={Timer} />
        <span className={`text-lg font-bold tabular-nums ${over ? "text-red-400" : ""}`}>{fmt(elapsed)} / 8:00</span>
        <button
          className="ms-auto flex size-9 items-center justify-center rounded-lg bg-white/10 transition-[scale] duration-150 ease-out active:scale-[0.96]"
          onClick={() => {
            setNow(Date.now());
            setStartedAt(startedAt === null ? Date.now() : null);
          }}
          aria-label={startedAt === null ? "Start timer" : "Stop timer"}
        >
          <I icon={startedAt === null ? Play : Pause} />
        </button>
        <button
          className="flex size-9 items-center justify-center rounded-lg bg-white/10 transition-[scale] duration-150 ease-out active:scale-[0.96]"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle checklist"
        >
          <I icon={ChevronDown} className={`transition-transform duration-150 ${open ? "" : "rotate-180"}`} />
        </button>
      </div>
      {open && (
        <div className="max-h-[55dvh] overflow-y-auto overscroll-contain px-3 pb-3">
          <ol className="grid gap-1">
            {BEATS.map((b, i) => (
              <li key={i}>
                <label className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm ${done.includes(i) ? "text-white/40 line-through" : ""}`}>
                  <input type="checkbox" className="mt-0.5 size-4 accent-teal-400" checked={done.includes(i)} onChange={() => setDone(done.includes(i) ? done.filter((x) => x !== i) : [...done, i])} />
                  <span className="w-9 shrink-0 font-mono tabular-nums text-white/60">{b.at}</span>
                  <span className="flex-1">
                    {b.label}
                    {b.href && (
                      <a href={b.href} className="ms-1 text-teal-300 underline underline-offset-2">
                        open
                      </a>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ol>
          <button
            onClick={reset}
            disabled={resetting}
            className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white/10 text-sm font-semibold transition-[scale,background-color] duration-150 ease-out hover:bg-white/15 enabled:active:scale-[0.96] disabled:opacity-40"
          >
            <I icon={RotateCcw} /> Reset demo (keeps recorded AI answers)
          </button>
        </div>
      )}
    </div>
  );
}
