importScripts('/build-id.js');

const BUILD_ID = self.SMART_SAFAR_BUILD_ID || 'development';
const STATIC_CACHE = `smart-safar-static-${BUILD_ID}`;
const TILE_CACHE = `smart-safar-tiles-${BUILD_ID}`;
const MAX_TILE_ENTRIES = 400;
const PRECACHE_URLS = [
  '/', '/routes', '/live-map', '/m', '/m/map', '/m/routes', '/m/book', '/offline.html',
  '/manifest.webmanifest', '/prepaint.js', '/logo.svg', '/icons/smart-safar-192.png',
  '/icons/smart-safar-512.png', '/icons/smart-safar-maskable-512.png',
  '/images/faisalabad-clock-tower.jpg',
];
const PRIVATE_PATH = /^\/(?:passenger|driver|admin)(?:\/|$)|^\/m\/(?:login|driver|account|trips)(?:\/|$)/;
const NEVER_CACHE_PATH = /^\/(?:api(?:\/|$)|socket\.io(?:\/|$)|auth(?:\/|$)|bookings(?:\/|$)|admin(?:\/|$)|driver(?:\/|$)|passenger(?:\/|$))|^\/m\/(?:login|driver|account|trips)(?:\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE)
    .then((cache) => cache.addAll(PRECACHE_URLS).catch((error) => console.warn('[SW] Some shell URLs could not be precached:', error)))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    self.registration.navigationPreload?.enable().catch(() => {}),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('smart-safar-static-') && key !== STATIC_CACHE || key.startsWith('smart-safar-tiles-') && key !== TILE_CACHE).map((key) => caches.delete(key)))),
  ]).then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function canonicalNavigationRequest(url) {
  return new Request(new URL(url.pathname, self.location.origin).toString(), { method: 'GET', credentials: 'same-origin' });
}

function protectedOfflineResponse() {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f4f5fb"><title>Connection needed | Smart Safar</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f5fb;color:#293553;font:16px Arial,sans-serif}.card{width:min(100%,430px);padding:30px;border:1px solid #dce2f1;border-radius:24px;background:#fff;box-shadow:0 20px 55px #2331571a}h1{font-size:24px;margin:0 0 12px}p{color:#68738e;line-height:1.6}.button{min-height:44px;padding:0 18px;border:0;border-radius:12px;background:#536bb7;color:white;font-weight:700;cursor:pointer}</style><main class="card"><h1>You need a connection for this page</h1><p>Sign-in and workspace details need to be loaded securely when you are online.</p><button class="button" onclick="location.reload()">Retry</button></main></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function updateNavigationCache(request, event, cache, cacheKey) {
  const preloaded = await event.preloadResponse;
  const response = preloaded || await fetch(request);
  if (response?.status === 200 && !request.headers.has('Authorization')) await cache.put(cacheKey, response.clone());
  return response;
}

async function handleNavigation(request, event, url) {
  const cache = await caches.open(STATIC_CACHE);
  const cacheKey = canonicalNavigationRequest(url);
  const cached = await cache.match(cacheKey);
  const update = updateNavigationCache(request, event, cache, cacheKey);
  if (cached) {
    event.waitUntil(update.catch(() => {}));
    return cached;
  }
  try { return await update; }
  catch (_error) {
    const offline = await cache.match('/offline.html');
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_TILE_ENTRIES) await Promise.all(keys.slice(0, keys.length - MAX_TILE_ENTRIES).map((key) => cache.delete(key)));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin && url.hostname !== 'tile.openstreetmap.org') return;

  if (request.mode === 'navigate' && PRIVATE_PATH.test(url.pathname)) {
    event.respondWith(fetch(request).catch(() => protectedOfflineResponse()));
    return;
  }
  if (request.headers.has('Authorization') || NEVER_CACHE_PATH.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request, event, url));
    return;
  }

  if (url.hostname === 'tile.openstreetmap.org') {
    event.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const cached = await cache.match(request);
      const update = fetch(request).then(async (response) => {
        if (response.status === 200) { await cache.put(request, response.clone()); await trimTileCache(); }
        return response;
      });
      if (cached) { event.waitUntil(update.catch(() => {})); return cached; }
      return update;
    })().catch(() => caches.match(request)));
    return;
  }

  if (url.origin === self.location.origin && (url.pathname === '/prepaint.js' || url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/splash/'))) {
    event.respondWith(caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.status === 200) (await caches.open(STATIC_CACHE)).put(request, response.clone());
      return response;
    }));
  }
});
