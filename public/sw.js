const CACHE_NAME = "driver-pay-v5-2-0-standard-weekly-rest-foundation";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-v5-192.png", "/icons/icon-v5-512.png", "/favicon.ico", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function shouldBypassCache(requestUrl) {
  return requestUrl.pathname.startsWith("/_vercel/");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

async function staleWhileRevalidate(request, fallbackUrl) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    networkPromise.catch(() => undefined);
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse || caches.match(fallbackUrl);
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || shouldBypassCache(requestUrl)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(new Request("/index.html"), "/index.html"));
    return;
  }

  if (requestUrl.pathname.startsWith("/assets/") || requestUrl.pathname.startsWith("/icons/") || requestUrl.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request, "/index.html"));
});


self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
