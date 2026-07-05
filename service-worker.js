// ============================================================================
// Studify Service Worker - Offline-First Static Asset Caching
// ============================================================================
const CACHE_NAME = 'studify-cache-v4';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json',
    '/assets/xlsx.full.min.js'
];

// Install: Cache all core static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing & caching static assets...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            return self.skipWaiting(); // Activate immediately
        })
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            return self.clients.claim(); // Take control of all pages
        })
    );
});

// Fetch: Cache-first for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and Firebase/Google API calls
    if (event.request.method !== 'GET') return;
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') || 
        url.hostname.includes('gstatic') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('cdnjs.cloudflare.com')) {
        return; // Let these go to network directly
    }

    // Cache-first strategy for local static assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Cache new resources dynamically
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback for HTML pages
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
