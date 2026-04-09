const CACHE_NAME = "exif-editor-v1";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/scripts/main.js",
  "/scripts/state.js",
  "/scripts/ui.js",
  "/scripts/exifEditor.js",
  "/scripts/fileHandler.js",
  "/scripts/presets.js",
  "/scripts/i18n.js",
  "/favicon.ico",
];

const CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/piexifjs",
  "https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...PRECACHE_URLS, ...CDN_URLS]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network first for navigation, cache first for assets
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful GET responses
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
