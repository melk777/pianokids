// Pianify service worker.
// - Makes the site installable and keeps heavy static assets (piano samples,
//   build chunks, images) available offline and instant on repeat visits.
// - Never caches API responses or authenticated pages: those are always
//   fetched from the network. When a page cannot load, a small offline page
//   is shown instead.
const VERSION = "v1";
const STATIC_CACHE = `pianify-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const CACHE_FIRST_PREFIXES = ["/audio/", "/_next/static/", "/images/", "/icons/", "/fonts/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (CACHE_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === "basic") cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});
