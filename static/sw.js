const CACHE_NAME = "rythu-mitra-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/idb-history.js",
  "/manifest.json",
  "/images/copper_oxychloride.svg",
  "/images/carbendazim.svg",
  "/images/neem_oil.svg",
  "/images/streptocycline.svg",
  "/images/mancozeb.svg",
  "/images/healthy_crop.svg"
];

// Install Event: Cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache-First for assets, Network-First with Cache fallback for audio & images
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If request is for audio files or product images, cache them for offline audio listening
  if (url.pathname.startsWith("/api/audio/") || url.pathname.startsWith("/images/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and not in cache, fallback
          return cachedResponse || new Response("Offline audio unavailable", { status: 503 });
        }
      })
    );
    return;
  }

  // Default stale-while-revalidate / cache-first for static files
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Fetch in background to update cache
        fetch(event.request).then((fresh) => {
          if (fresh && fresh.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fresh));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).catch(() => caches.match("/index.html"));
    })
  );
});
