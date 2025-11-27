const CACHE_NAME = 'sib-pwa-shell-v1';
const DYNAMIC_CACHE = 'sib-pwa-dynamic-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, DYNAMIC_CACHE].includes(key)) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (SHELL_ASSETS.includes(url.pathname) || request.destination === 'style' || request.destination === 'script' || request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.includes('manifest')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('/index.html'))
    );
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
