// Offline support: everything except Claude calls works without a network.
// Pages and static assets: network first, cache fallback. Models, ORT runtime, demo images: cache first.
const VERSION = "electroquest-v1";
const PRECACHE = ["/", "/fix", "/scan", "/inventory", "/projects", "/progress", "/model-card", "/manifest.webmanifest", "/demo/parts-pile.svg", "/demo/tv-board.svg", "/demo/tv-board-dead.svg", "/demo/golden-tv-remote.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const heavy = /^\/(models|ort|demo|icons)\//.test(url.pathname) || url.pathname.startsWith("/_next/static/");
  if (heavy) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
  );
});
