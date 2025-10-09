/*
 * Portfolio PWA Service Worker
 *
 * Uitleg (NL):
 * - We cachen kernbestanden zodat de site offline werkt.
 * - Navigatieverzoeken (HTML-pagina's) proberen eerst het netwerk (network-first)
 *   en vallen bij een fout terug op offline.html.
 * - Statische assets (css/js/afbeeldingen) gebruiken een cache-first aanpak met
 *   achtergrond-update zodat ze snel laden en toch verversen.
 */
const CACHE_NAME = 'portfolio-cache-v1.0.3';
const OFFLINE_URL = '/offline.html';

// Assets om vooraf te cachen (klein houden en alleen self-hosted bestanden)
const PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/css/style.css',
  '/css/offline.css',
  '/js/main.js',
  '/js/offline.js',
  '/images/portfolio.png'
];

// Install-fase: cache vullen en direct de nieuwe SW klaarzetten
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate-fase: oude caches opruimen en controle nemen over open pagina's
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch-afhandeling:
// - Navigaties: network-first (bij fail -> offline.html)
// - Statische assets: cache-first (met netwerk-update)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // HTML-pagina's: eerst proberen via netwerk, anders offline fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          // Cache op achtergrond verversen met de echte URL als key
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Voor same-origin CSS/JS/afbeeldingen: eerst cache, dan netwerk (en cache updaten)
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && (/\.(?:css|js|png|jpg|jpeg|gif|webp|svg|ico|json)$/i).test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
            return networkResponse;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
