// ============================================================================
// Studify Service Worker - Offline-First Static Asset Caching
// ============================================================================
const CACHE_NAME = 'studify-cache-v17';
const STATIC_ASSETS = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './icon-192.png',
    './icon-512.png',
    './manifest.json',
    './assets/xlsx.full.min.js'
];

// Install: Cache all core static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing & caching static assets...');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
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

// Fetch: Network-first strategy for local static code assets to ensure updates load immediately
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') || 
        url.hostname.includes('gstatic') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
