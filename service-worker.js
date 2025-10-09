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
const CACHE_NAME = 'portfolio-cache-v1.0.8';
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

// Push melding (voor DevTools 'Push' test en echte push)
self.addEventListener('push', (event) => {
  // Probeer payload te lezen (DevTools kan tekst of JSON sturen)
  let title = 'Portfolio update';
  let body = 'Er is iets nieuws!';
  try {
    if (event.data) {
      const txt = event.data.text();
      try {
        const obj = JSON.parse(txt);
        title = obj.title || title;
        body = obj.body || body;
      } catch {
        body = txt || body;
      }
    }
  } catch {}

  const options = {
    body,
    icon: '/images/portfolio.png',
    badge: '/images/portfolio.png',
    data: { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Klik op notificatie: focus bestaande tab of open nieuwe
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
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
    const url = new URL(request.url);
    // Speciaal: vraag naar offline.html -> serveer direct uit cache als fallback
    if (url.pathname === '/offline.html') {
      event.respondWith(
        fetch(request).catch(() => caches.match('/offline.html'))
      );
      return;
    }
    // Overig: network-first; bij fail 404.html
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Niet meer cachen van navigatie-antwoorden om verwarring te voorkomen
          return response;
        })
        .catch(() => caches.match('/404.html'))
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
