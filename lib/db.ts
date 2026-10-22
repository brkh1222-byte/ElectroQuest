"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { useEffect, useState } from "react";
import type { Detection, InventoryItem } from "./schemas";
import type { DiagnosisState } from "./diagnosis";

/**
 * Local-first storage (IndexedDB). Everything the user does lives on the phone, so the demo works
 * on flaky venue Wi-Fi. No login for the MVP.
 */

export interface ScanPhoto {
  blob: Blob;
  width: number;
  height: number;
  detections: Detection[];
  /** Detections the user said are the same parts as in an earlier photo. */
  duplicateIds: string[];
  demoKey?: string;
}
export interface Scan {
  id: string;
  createdAt: number;
  kind: "parts" | "salvage" | "board";
  photos: ScanPhoto[];
  from?: string;
}
export interface Repair {
  id: string;
  deviceId: string;
  startedAt: number;
  finishedAt?: number;
  outcome: "in_progress" | "fixed" | "salvaged" | "abandoned";
  causeId?: string;
  state: DiagnosisState;
  boardScanId?: string;
}
export interface Completion {
  id: string; // recipe id
  completedAt: number;
}
export interface AiLogEntry {
  id?: number;
  ts: number;
  task: string;
  ok: boolean;
  ms: number;
  model?: string;
  source: "live" | "replay" | "canned";
  demoKey?: string;
  input: string;
  output: string;
}
export interface DemoCacheEntry {
  key: string;
  task: string;
  data: unknown;
  recordedAt: number;
}

interface ZasvarDB extends DBSchema {
  inventory: { key: string; value: InventoryItem };
  scans: { key: string; value: Scan };
  repairs: { key: string; value: Repair };
  completions: { key: string; value: Completion };
  kv: { key: string; value: unknown };
  ailog: { key: number; value: AiLogEntry };
  demo_cache: { key: string; value: DemoCacheEntry };
}

type StoreName = "inventory" | "scans" | "repairs" | "completions" | "kv" | "ailog" | "demo_cache";

let dbp: Promise<IDBPDatabase<ZasvarDB>> | null = null;
function db() {
  dbp ??= openDB<ZasvarDB>("zasvar", 1, {
    upgrade(d) {
      d.createObjectStore("inventory", { keyPath: "id" });
      d.createObjectStore("scans", { keyPath: "id" });
      d.createObjectStore("repairs", { keyPath: "id" });
      d.createObjectStore("completions", { keyPath: "id" });
      d.createObjectStore("kv");
      d.createObjectStore("ailog", { keyPath: "id", autoIncrement: true });
      d.createObjectStore("demo_cache", { keyPath: "key" });
    },
  });
  return dbp;
}

// --- change notifications so screens re-read after writes ---
const listeners = new Set<(store: StoreName) => void>();
function changed(store: StoreName) {
  for (const l of listeners) l(store);
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const store = {
  async all<S extends Exclude<StoreName, "kv">>(name: S): Promise<ZasvarDB[S]["value"][]> {
    return (await db()).getAll(name);
  },
  async get<S extends Exclude<StoreName, "kv">>(name: S, key: ZasvarDB[S]["key"]): Promise<ZasvarDB[S]["value"] | undefined> {
    return (await db()).get(name, key);
  },
  async put<S extends Exclude<StoreName, "kv">>(name: S, value: ZasvarDB[S]["value"]) {
    await (await db()).put(name, value);
    changed(name);
  },
  async putMany<S extends Exclude<StoreName, "kv">>(name: S, values: ZasvarDB[S]["value"][]) {
    const tx = (await db()).transaction(name, "readwrite");
    await Promise.all([...values.map((v) => tx.store.put(v)), tx.done]);
    changed(name);
  },
  async delete<S extends Exclude<StoreName, "kv">>(name: S, key: ZasvarDB[S]["key"]) {
    await (await db()).delete(name, key);
    changed(name);
  },
  async clear(name: StoreName) {
    await (await db()).clear(name);
    changed(name);
  },
  async kvGet<T>(key: string, fallback: T): Promise<T> {
    const v = await (await db()).get("kv", key);
    return (v as T) ?? fallback;
  },
  async kvSet(key: string, value: unknown) {
    await (await db()).put("kv", value, key);
    changed("kv");
  },
};

/** Re-run `read` whenever one of `stores` changes. Returns undefined while loading. */
export function useLive<T>(read: () => Promise<T>, stores: StoreName[], deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let alive = true;
    const run = () =>
      read()
        .then((v) => alive && setValue(v))
        .catch((e) => console.error("[db]", e));
    run();
    const l = (s: StoreName) => stores.includes(s) && run();
    listeners.add(l);
    return () => {
      alive = false;
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

export async function latestScan(kind?: Scan["kind"]): Promise<Scan | undefined> {
  const scans = await store.all("scans");
  return scans.filter((s) => !kind || s.kind === kind).sort((a, b) => b.createdAt - a.createdAt)[0];
}
