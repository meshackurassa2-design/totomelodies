const CACHE_NAME = 'totomelodies-v26';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style_v2.css',
  './js/app.js?v=10',
  './js/songs.js',
  './js/supabase.js',
  './manifest.json',
  './assets/lion_mascot_1779138323522.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately
  );
});

// Network First, Cache Fallback Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});








