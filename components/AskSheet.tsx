"use client";

import { useState } from "react";
import { ai, AiError } from "@/lib/ai-client";
import { useI18n } from "@/lib/i18n";
import { mentionsMains } from "@/lib/safety";
import { Button, ErrorBox, Spinner } from "./ui";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

/** "Ask about this step": Claude answers from the recipe / fix-plan JSON only. */
export function AskSheet({
  title,
  contextKind,
  context,
  onClose,
}: {
  title: string;
  contextKind: "build_step" | "repair";
  context: unknown;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async (question: string) => {
    setErr(null);
    const history = msgs;
    setMsgs([...history, { role: "user", text: question }]);
    setQ("");
    if (mentionsMains(question)) {
      setMsgs((m) => [...m, { role: "assistant", text: t("mains_refuse") }]);
      return;
    }
    setBusy(true);
    try {
      const r = await ai("ask", { context_kind: contextKind, context, question, history }, { lang });
      setMsgs((m) => [...m, { role: "assistant", text: r.answer }]);
    } catch (e) {
      setMsgs(history);
      setQ(question);
      setErr(e instanceof AiError && e.offline ? t("ai_offline") : `${t("ai_error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
      <div className="pb-safe mx-auto flex max-h-[85dvh] w-full max-w-xl flex-col rounded-t-3xl bg-surface p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <Button tone="ghost" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2 text-lg ${m.role === "user" ? "ml-auto bg-ink text-white" : "bg-bg"}`}>
              {m.text}
            </div>
          ))}
          {busy && <Spinner />}
          {err && <ErrorBox message={err} onRetry={() => send(q)} />}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim() && !busy) void send(q.trim());
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ask_placeholder")} className="min-h-12 flex-1 rounded-xl border-2 border-line px-3 text-lg" />
          <Button tone="plain" disabled={!q.trim() || busy}>
            {t("ask_send")}
          </Button>
        </form>
      </div>
    </div>
  );
}
