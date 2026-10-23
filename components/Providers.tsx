"use client";

import { useEffect, type ReactNode } from "react";
import { LangProvider } from "@/lib/i18n";
import { syncDemoFromUrl } from "@/lib/demo";
import { PresenterPanel } from "./PresenterPanel";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncDemoFromUrl();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("[sw]", e));
    }
  }, []);
  return (
    <LangProvider>
      {children}
      <PresenterPanel />
    </LangProvider>
  );
}
