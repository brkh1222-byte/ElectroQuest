// electroquest.pages.dev: serves the ElectroQuest app (Cloudflare Worker) under this address.
const ORIGIN = "https://electroquest.brkh1222.workers.dev";

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const target = ORIGIN + url.pathname + url.search;
  const forwarded = new Request(target, request);
  // The app rate-limits AI calls per visitor IP; pass it on, vouched for by the shared PROXY_KEY secret.
  if (env.PROXY_KEY) {
    forwarded.headers.set("x-eq-client-ip", request.headers.get("cf-connecting-ip") ?? "");
    forwarded.headers.set("x-eq-proxy-key", env.PROXY_KEY);
  }
  const res = await fetch(forwarded, { redirect: "manual" });
  // Keep redirects on this domain.
  const loc = res.headers.get("location");
  if (loc && loc.startsWith(ORIGIN)) {
    const headers = new Headers(res.headers);
    headers.set("location", loc.slice(ORIGIN.length) || "/");
    return new Response(res.body, { status: res.status, headers });
  }
  return res;
}
