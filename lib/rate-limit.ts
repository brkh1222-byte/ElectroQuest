import "server-only";

/**
 * Protects /api/ai (every call spends Claude credits):
 *  - same-site check: requests must come from the ElectroQuest app's own pages;
 *  - per-IP rate limit: Cloudflare's Workers rate-limiting binding in production (shared across the edge),
 *    an in-memory window when running locally.
 * The Pages address (electroquest.pages.dev) forwards to the Worker, so it passes the visitor's IP in a header
 * that is only trusted together with a shared secret (PROXY_KEY).
 */

export const LIMIT_PER_MINUTE = 40; // a full stage demo uses about 15 calls; a shared venue IP still has room

const ALLOWED_HOSTS = [/^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/, /^electroquest\.pages\.dev$/, /^[\w-]+\.electroquest\.pages\.dev$/, /^electroquest\.[\w-]+\.workers\.dev$/];

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

async function cloudflareEnv(): Promise<Record<string, unknown> | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return (await getCloudflareContext({ async: true })).env as unknown as Record<string, unknown>;
  } catch {
    return null; // not running on Cloudflare (next dev / tests)
  }
}

export function isSameSite(request: Request): boolean {
  const extra = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const from = request.headers.get("origin") ?? request.headers.get("referer");
  if (!from) return false;
  try {
    const host = new URL(from).host;
    return ALLOWED_HOSTS.some((re) => re.test(host)) || extra.includes(host);
  } catch {
    return false;
  }
}

function clientIp(request: Request, env: Record<string, unknown> | null): string {
  const h = request.headers;
  const proxyKey = typeof env?.PROXY_KEY === "string" ? env.PROXY_KEY : process.env.PROXY_KEY;
  if (proxyKey && h.get("x-eq-proxy-key") === proxyKey && h.get("x-eq-client-ip")) return h.get("x-eq-client-ip")!;
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

const memory = new Map<string, number[]>();

export async function allowRequest(request: Request): Promise<boolean> {
  const env = await cloudflareEnv();
  const ip = clientIp(request, env);
  const limiter = env?.AI_RATE_LIMITER as RateLimiter | undefined;
  if (limiter) return (await limiter.limit({ key: ip })).success;

  const now = Date.now();
  const recent = (memory.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= LIMIT_PER_MINUTE) {
    memory.set(ip, recent);
    return false;
  }
  recent.push(now);
  memory.set(ip, recent);
  return true;
}
