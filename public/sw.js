/*
 * MA'AD SAS Service Worker
 * Strategy: Network-first for all requests (safe for Firebase/API)
 * Caches static assets as a fallback so previously visited pages
 * still load when the network is temporarily unavailable.
 */

const CACHE_NAME = 'maad-sas-v2';

// Only cache same-origin static assets — never Firebase or external APIs
function isCacheableRequest(request) {
  const url = new URL(request.url);
  // Only same-origin
  if (url.origin !== self.location.origin) return false;
  // Only same-origin requests (JS, CSS, images, fonts, SVG)
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['js', 'css', 'html', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'].includes(ext);
}

// Install: activate immediately so new deploys propagate without stale caches.
self.addEventListener('install', (event) => {
  // skipWaiting() + clients.claim() below ensures a new deployment
  // replaces the old SW right away instead of letting stale cached
  // index.html (with old chunk hashes) linger in background tabs.
  event.waitUntil(self.skipWaiting());
});

// Listen for skip-waiting message from the app (kept for backward compat)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-cacheable requests (external APIs, Firebase, etc.)
  if (!isCacheableRequest(request)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(request).then((cached) => {
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
