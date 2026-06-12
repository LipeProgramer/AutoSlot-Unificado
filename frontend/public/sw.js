const CACHE_NAME = 'autoSlot-v1';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Requisições de API: network-first
  if (url.pathname.startsWith('/api')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ erro: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Assets estáticos: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
