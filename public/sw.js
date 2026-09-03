const CACHE_VERSION = 'geovoice-pwa-v3';
const APP_CACHE = `${CACHE_VERSION}-shell`;
const TILES_CACHE = `${CACHE_VERSION}-tiles`;

// Ressources de base indispensables à mettre en cache dès l'installation
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-maskable-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== APP_CACHE && key !== TILES_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // On ignore les requêtes non GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation SPA (ex: rafraîchissement d'une page hors-ligne)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(APP_CACHE);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        return cachedIndex || Response.error();
      })
    );
    return;
  }

  // 2. Tuiles de cartographie (OpenStreetMap, OpenTopoMap, etc.)
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('opentopomap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('basemaps.cartocdn.com')
  ) {
    event.respondWith(
      caches.open(TILES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Tuile déjà en cache (pratique en randonnée / zone blanche)
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          // Mettre en cache la tuile pour consultation ultérieure hors-ligne
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Hors ligne et tuile non mise en cache
          return cachedResponse || new Response('', { status: 408, statusText: 'Tile not cached offline' });
        }
      })
    );
    return;
  }

  // 3. Fichiers applicatifs locaux (JS, CSS, images, polices)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Stratégie Stale-While-Revalidate : renvoie la version en cache et met à jour en arrière-plan
      const fetchPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const cache = await caches.open(APP_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
