const CACHE_NAME = 'prefuel-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k)=>k!==CACHE_NAME).map((k)=> caches.delete(k)))).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // App shell: network first, then cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // API: try network, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then((res)=>{
        const resClone = res.clone();
        caches.open('prefuel-api-v1').then((c)=> c.put(event.request, resClone));
        return res;
      }).catch(()=> caches.match(event.request))
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(event.request).then((cached)=> cached || fetch(event.request).then((res)=>{
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((c)=> c.put(event.request, resClone));
      return res;
    }))
  );
});
