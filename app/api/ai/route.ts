import { AiRequest, TASKS, type AiResponse, type TaskName } from "@/lib/ai-tasks";
import { runTask, TaskError } from "@/lib/claude";

export const maxDuration = 60;

export async function POST(request: Request) {
  const started = Date.now();
  const reply = (body: Omit<AiResponse, "latency_ms">, status = 200) =>
    Response.json({ ...body, latency_ms: Date.now() - started } satisfies AiResponse, { status });

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
