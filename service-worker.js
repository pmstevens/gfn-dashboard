const CACHE_NAME = 'gfn-dashboard-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// install: cache core files
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate: cleanup old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', (evt) => {
  if (evt.request.mode === 'navigate') {
    evt.respondWith(fetch(evt.request).catch(() => caches.match('/index.html')));
    return;
  }
  evt.respondWith(
    caches.match(evt.request).then(r => r || fetch(evt.request).then(fetchRes => {
      // cache fetched asset for offline later (optionally)
      return caches.open(CACHE_NAME).then(cache => {
        try { cache.put(evt.request, fetchRes.clone()); } catch (e) {}
        return fetchRes;
      });
    }))
  );
});