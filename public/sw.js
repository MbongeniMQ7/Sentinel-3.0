const CACHE_NAME = "sentinel-offline-v1"
const OFFLINE_URL = "/offline.html"
const STATIC_ASSETS = [OFFLINE_URL, "/pwa-192.png", "/pwa-512.png", "/pwa-maskable-512.png", "/pwa-apple-180.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("sentinel-offline-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME)
      return (await cache.match(OFFLINE_URL)) || Response.error()
    }))
    return
  }

  if (STATIC_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => (await cache.match(event.request)) || fetch(event.request)))
  }
})