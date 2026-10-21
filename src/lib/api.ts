import "server-only";

import { z } from "zod";
import { getCurrentUser } from "./auth";
import { getProblem } from "./problems/loader";

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function parseBody<T extends z.ZodType>(req: Request, schema: T) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

/** Loads the problem and signed-in user for an LLM-backed problem route. */
export async function requireUserAndProblem(slug: string, types: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError(401, "Sign in to run AI problems.") } as const;
  const problem = await getProblem(slug);
  if (!problem || !types.includes(problem.config.type)) {
    return { error: jsonError(404, "Problem not found.") } as const;
  }
  return { user, problem } as const;
}

/** Runs async tasks with a concurrency cap so a Submit doesn't burst the gateway. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
