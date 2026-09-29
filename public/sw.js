// Simple service worker for offline-first PWA.
// Caches the app shell and API responses with a network-first strategy
// for API (so fresh data is used when online) and cache-first for static assets.

const CACHE_VERSION = "forestry-planner-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests (let them go to network)
  if (req.method !== "GET") return;

  // Skip Next.js dev/HMR requests
  if (url.pathname.startsWith("/_next/webpack")) return;
  if (url.pathname.includes("hot-reloader")) return;

  // API requests: network-first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache successful API responses
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || new Response(
            JSON.stringify({ error: "Offline — data unavailable" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          )),
        ),
    );
    return;
  }

  // Static assets and pages: cache-first, fall back to network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cache successful responses
          if (res.ok && res.type === "basic") {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // For navigation requests, serve the cached root as fallback
          if (req.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});
