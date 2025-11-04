// Service Worker v5 - Network-First with Smart Caching
// November 4, 2025 - Complete rewrite to fix update issues

const CACHE_VERSION = 'v5-20251104';
const CACHE_NAME = `einbuergerungstest-${CACHE_VERSION}`;

// Only cache essential static assets that we KNOW exist
const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: Precache only essential assets, skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW v5] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v5] Precaching essential assets');
        // Don't fail if assets don't exist
        return Promise.allSettled(
          ESSENTIAL_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn('[SW v5] Failed to cache:', url))
          )
        );
      })
      .then(() => {
        console.log('[SW v5] Installation complete, skipping waiting');
        // CRITICAL: Take control immediately
        return self.skipWaiting();
      })
  );
});

// Activate: Clean old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW v5] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Delete all old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW v5] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // CRITICAL: Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW v5] Activation complete, controlling all clients');
    })
  );
});

// Fetch: Network-First strategy (NEVER cache API requests)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // NEVER cache API requests - always fetch fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // For all other requests: Network-First with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses for static assets
        if (response.status === 200 && !url.pathname.startsWith('/api/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache (offline support)
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('[SW v5] Serving from cache (offline):', url.pathname);
            return cachedResponse;
          }
          // No cache available - return error
          if (request.destination === 'document') {
            return caches.match('/');
          }
          return new Response('Offline - kein Cache verfügbar', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v5] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});