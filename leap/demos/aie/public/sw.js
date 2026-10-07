const CACHE = 'q9-aie-428ea2c7e9d5a2ee';
const ASSETS = ["/","/app.js","/apple-touch-icon.png","/assets/art/aie-logo.webp","/assets/art/icon-ava.webp","/assets/art/icon-chalk.webp","/assets/art/icon-edli.webp","/assets/art/icon-flow.webp","/assets/art/icon-mesa.webp","/assets/art/icon-nura.webp","/assets/art/icon-terminal.webp","/assets/art/icon-track.webp","/assets/art/kiosk.webp","/assets/fonts/HostGrotesk-latin-ext.woff2","/assets/fonts/HostGrotesk-latin.woff2","/assets/fonts/IBMPlexSansArabic-SemiBold.woff2","/assets/logos/q9.svg","/assets/voice/voice-lines.json","/attract.js","/demos/ava.js","/demos/chalk.js","/demos/edli.js","/demos/flow.js","/demos/nura.js","/demos/track.js","/favicon.ico","/icons.js","/kiosk-screen.js","/og.jpg","/sound.js","/styles.css","/ui.js","/updates.js"];
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
