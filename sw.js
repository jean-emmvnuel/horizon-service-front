/**
 * HORIZON SERVICE — Service Worker Clean-up
 * Supprime tous les caches existants et se désinscrit immédiatement
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Toutes les requêtes sont passées directement au réseau sans aucun cache
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
