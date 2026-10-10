// Network-first PWA worker. Cache failures must NEVER override successful fetches.
const CACHE_PREFIX = 'lovepoke-';
const CACHE_NAME = CACHE_PREFIX + 'v20261011-163';

// Only essential shell assets are precached. Large optional images/data are
// cached on successful requests so a single failed image cannot block an update.
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './styles.css?v=20261010-tools73',
  './app.js',
  './pokemon-guide.js?v=20261011-tools99',
  './pokemon-data.js',
  './pokemon-stats.js',
  './pokemon-dex-extra.js?v=20261010-dex1',
  './pokemon-types.js',
  './pokemon-sv-learnsets.js',
  './pokemon-sv-regional-dex.js',
  './pokemon-sv-acquisition.js',
  './pokemon-sv-location-summaries.js',
  './pokemon-move-details.js?v=20261010-moves1',
  './mascot-multi.js',
  './mascot.css',
  './mini-live/launcher.js',
  './version.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(CORE_ASSETS.map(async url => {
        try {
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (response.ok) await cache.put(url, response);
        } catch (_) {
          // Offline, quota exceeded, or a temporarily missing asset: never
          // abort the whole service-worker installation.
        }
      }));
    } catch (_) {
      // An unavailable Cache Storage must not prevent updating the application.
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key).catch(() => false)));
    } catch (_) {}
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    let response;
    try {
      response = await fetch(event.request, { cache: 'no-store' });
    } catch (_) {
      // Use cache only when the NETWORK failed, not when writing to cache fails.
      try {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
      } catch (_) {}
      return Response.error();
    }

    if (response.ok) {
      try {
        const copy = response.clone();
        const save = (async () => {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, copy);
          } catch (_) {
            // Ignore quota/storage errors; retain the fresh network response.
          }
        })();
        event.waitUntil(save);
      } catch (_) {}
    }
    return response;
  })());
});
