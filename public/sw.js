const CACHE_NAME = 'campusniti-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Do not cache API routes to ensure fresh data
  if (event.request.url.includes('/api/')) return;
  
  // Network-first strategy for everything else to ensure they get the latest app shell
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
