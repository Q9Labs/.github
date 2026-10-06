const CACHE = 'q9-aie-e3ee073ed26e5803';
const ASSETS = ["/","/app.js","/apple-touch-icon.png","/assets/art/aie-logo.webp","/assets/art/icon-ava.webp","/assets/art/icon-chalk.webp","/assets/art/icon-edli.webp","/assets/art/icon-flow.webp","/assets/art/icon-mesa.webp","/assets/art/icon-nura.webp","/assets/art/icon-terminal.webp","/assets/art/icon-track.webp","/assets/art/kiosk.webp","/assets/fonts/HostGrotesk-latin-ext.woff2","/assets/fonts/HostGrotesk-latin.woff2","/assets/fonts/IBMPlexSansArabic-SemiBold.woff2","/assets/logos/q9.svg","/demos/ava.js","/demos/chalk.js","/demos/edli.js","/demos/flow.js","/demos/nura.js","/demos/track.js","/favicon.ico","/icons.js","/og.jpg","/styles.css","/ui.js"];
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
