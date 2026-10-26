import { AiRequest, TASKS, type AiResponse, type TaskName } from "@/lib/ai-tasks";
import { runTask, TaskError } from "@/lib/ai";
import { allowRequest, isSameSite } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const started = Date.now();
  const reply = (body: Omit<AiResponse, "latency_ms">, status = 200) =>
    Response.json({ ...body, latency_ms: Date.now() - started } satisfies AiResponse, { status });

  // Every call spends the AI quota: only our own pages may call, and only so often per visitor.
  if (!isSameSite(request)) return reply({ ok: false, error: "Requests must come from the ElectroQuest app." }, 403);
  if (!(await allowRequest(request))) {
    return Response.json(
      { ok: false, error: "Too many AI requests. Wait a minute and try again. / Хэт олон хүсэлт. Нэг минут хүлээгээд дахин оролдоно уу.", latency_ms: Date.now() - started } satisfies AiResponse,
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, error: "body must be JSON" }, 400);
  }
  const req = AiRequest.safeParse(body);
  if (!req.success) return reply({ ok: false, error: req.error.message }, 400);
  if (!(req.data.task in TASKS)) return reply({ ok: false, error: `unknown task ${req.data.task}` }, 400);

  try {
    const out = await runTask(req.data.task as TaskName, req.data.lang, req.data.input);
    return reply({ ok: true, data: out.data, model: out.model, attempts: out.attempts });
  } catch (e) {
    if (e instanceof TaskError) return reply({ ok: false, error: e.message }, e.status);
    console.error("[api/ai]", e);
    return reply({ ok: false, error: "unexpected server error" }, 500);
  }
}
