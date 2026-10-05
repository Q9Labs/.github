const CACHE = 'q9-aie-fa50179ff9c64ca6';
const ASSETS = ["/","/app.js","/assets/fonts/HostGrotesk-latin-ext.woff2","/assets/fonts/HostGrotesk-latin.woff2","/assets/fonts/IBMPlexSansArabic-SemiBold.woff2","/assets/logos/q9.svg","/demos/ava.js","/demos/chalk.js","/demos/edli.js","/demos/flow.js","/demos/nura.js","/demos/track.js","/icons.js","/styles.css","/ui.js"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
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
  if (ASSETS.includes(path)) event.respondWith(caches.open(CACHE).then(cache => cache.match(path)).then(cached => cached || fetch(event.request)));
});
