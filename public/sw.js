const CACHE_NAME = 'switcholed-v3';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/apple-icon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      // Reload open tabs once so they stop running code served by the previous worker.
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url).catch(() => {})))
  );
});

const networkFirst = (request) =>
  fetch(request)
    .then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
      }
      return res;
    })
    .catch(() => caches.match(request));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const dest = event.request.destination;
  if (dest === 'document') {
    // Pages: always fresh, offline fallback to the home page
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
  } else if (dest === 'script' || dest === 'style') {
    // Code: network-first so a deploy is picked up immediately
    event.respondWith(networkFirst(event.request));
  } else if (dest === 'image' || dest === 'font') {
    // Media: cache-first
    event.respondWith(
      caches.match(event.request).then((cached) => cached || networkFirst(event.request))
    );
  }
});
