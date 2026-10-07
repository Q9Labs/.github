const CACHE = 'q9-aie-__CACHE_VERSION__';
const ASSETS = __ASSETS__;
// Same-origin assets are network-first so new HTML never runs against stale JS or CSS. The cache
// is the offline fallback, and a slow network falls back to it after NETWORK_TIMEOUT_MS.
const NETWORK_TIMEOUT_MS = 4000;
// Voice lines are cached on first play instead of precached, so phones don't download them.
const RUNTIME_PREFIX = '/assets/voice/';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(path, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('q9-aie-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match('/'))));
    return;
  }
  const path = new URL(event.request.url).pathname;
  if (ASSETS.includes(path) || path.startsWith(RUNTIME_PREFIX)) event.respondWith(networkFirst(event.request, path));
});
async function networkFirst(request, path) {
  const cache = await caches.open(CACHE);
  const network = fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) cache.put(path, response.clone()).catch(error => console.warn(`Could not cache ${path}`, error));
    return response;
  });
  const timeout = new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  const fresh = await Promise.race([network, timeout]).catch(() => null);
  if (fresh) return fresh;
  return (await cache.match(path)) || network;
}
