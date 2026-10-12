const CACHE_VERSION = 'smart-safar-v1';
const STATIC_CACHE = `smart-safar-static-${CACHE_VERSION}`;
const TILE_CACHE = `smart-safar-tiles-${CACHE_VERSION}`;
const MAX_TILE_ENTRIES = 400;

const PRECACHE_URLS = [
  '/',
  '/routes',
  '/live-map',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo.svg',
  '/icons/smart-safar-192.png',
  '/icons/smart-safar-512.png',
  '/icons/smart-safar-maskable-512.png',
  '/images/faisalabad-clock-tower.jpg',
];

const NEVER_CACHE_PATTERNS = [
  /\/passenger(\/|$)/,
  /\/driver(\/|$)/,
  /\/admin(\/|$)/,
  /\/api\//,
  /\/auth\//,
  /\/bookings\//,
  /\/socket\.io\//,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== TILE_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const itemsToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(itemsToDelete.map((req) => cache.delete(req)));
    }
  } catch (_e) {}
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never cache sensitive, role, or dynamic API/socket routes
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // 1. Navigation requests (HTML pages) - Network-first with 3.5s timeout -> cached copy -> /offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve(null), 3500)
        );

        try {
          const networkPromise = fetch(request).then(async (response) => {
            if (response && response.status === 200) {
              const cache = await caches.open(STATIC_CACHE);
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => null);

          const result = await Promise.race([networkPromise, timeoutPromise]);
          if (result) return result;

          // If network timed out or failed, try cache
          const cached = await caches.match(request);
          if (cached) return cached;

          // Fallback to /offline.html
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        } catch (_err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
    return;
  }

  // 2. OpenStreetMap tiles - Stale-while-revalidate capped at ~400 entries
  if (url.hostname === 'tile.openstreetmap.org') {
    event.respondWith(
      (async () => {
        const tileCache = await caches.open(TILE_CACHE);
        const cached = await tileCache.match(request);

        const fetchPromise = fetch(request)
          .then(async (response) => {
            if (response && response.status === 200) {
              await tileCache.put(request, response.clone());
              trimCache(TILE_CACHE, MAX_TILE_ENTRIES);
            }
            return response;
          })
          .catch(() => null);

        return cached || (await fetchPromise);
      })()
    );
    return;
  }

  // 3. Cache-first for static assets: /_next/static, /icons, /images, /splash
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/splash/')
  ) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }
});
