// electroquest.pages.dev: serves the ElectroQuest app (Cloudflare Worker) under this address.
const ORIGIN = "https://electroquest.brkh1222.workers.dev";

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const target = ORIGIN + url.pathname + url.search;
  const res = await fetch(new Request(target, request), { redirect: "manual" });
  // Keep redirects on this domain.
  const loc = res.headers.get("location");
  if (loc && loc.startsWith(ORIGIN)) {
    const headers = new Headers(res.headers);
    headers.set("location", loc.slice(ORIGIN.length) || "/");
    return new Response(res.body, { status: res.status, headers });
  }
  return res;
}
