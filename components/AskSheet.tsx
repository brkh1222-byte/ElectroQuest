"use client";

import { useState } from "react";
import { ai, AiError } from "@/lib/ai-client";
import { useI18n } from "@/lib/i18n";
import { mentionsMains } from "@/lib/safety";
import { Send, X } from "lucide-react";
import { Button, ErrorBox, I, Sheet, Spinner } from "./ui";

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
    <Sheet onClose={onClose} wide>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <Button tone="ghost" size="sm" onClick={onClose} aria-label={t("close")}>
            <I icon={X} />
          </Button>
        </div>
        <div className="min-h-40 flex-1 space-y-2 overflow-y-auto overscroll-contain">
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
            <I icon={Send} /> {t("ask_send")}
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
