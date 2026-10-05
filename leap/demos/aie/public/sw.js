const CACHE = 'q9-aie-c457a3a969b74b58';
const ASSETS = ["/","/app.js","/assets/fonts/Jost-Black.woff2","/assets/fonts/Jost-Bold.woff2","/assets/fonts/Jost-ExtraBold.woff2","/assets/fonts/Jost-Medium.woff2","/assets/fonts/Jost-Regular.woff2","/assets/fonts/Jost-SemiBold.woff2","/assets/fonts/Rubik-SemiBold.woff2","/assets/logos/ava-logo-trimmed.png","/assets/logos/chalk-logo-trimmed.png","/assets/logos/edli-logo-trimmed.png","/assets/logos/flow-logo-trimmed.png","/assets/logos/nura-logo-trimmed.png","/assets/logos/q9.svg","/assets/logos/track-logo-trimmed.png","/demos/ava.js","/demos/chalk.js","/demos/edli.js","/demos/flow.js","/demos/nura.js","/demos/track.js","/icons.js","/styles.css","/ui.js"];
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
