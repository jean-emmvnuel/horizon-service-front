/**
 * HORIZON SERVICE — Service Worker (PWA)
 * Cache statique pour fonctionnement hors-ligne partiel
 */

const CACHE_NAME = 'horizon-service-v10';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/app.js',
  './js/data.js',
  './logo.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des ressources statiques');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Suppression de l\'ancien cache :', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// Fetch : stratégie Network First (API) / Cache First (statique)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pour les appels API backend (Render, localhost, /api, /auth), toujours réseau pur sans cache
  if (url.hostname.includes('onrender.com') || url.hostname === 'localhost' || url.port === '3001' || url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) {
    return; // Laisse passer directement au réseau
  }

  // Pour les ressources statiques : Network First avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre à jour le cache avec la réponse fraîche
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache en cas d'absence de réseau
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Page hors-ligne pour les navigations
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
