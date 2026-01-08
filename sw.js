const CACHE_NAME = 'nasa-portal-static-v5';
const IMAGE_CACHE = 'nasa-portal-images-v1';
const API_CACHE = 'nasa-portal-api-v1';

const urlsToCache = [
    './',
    './index.html',
    './offline.html',
    './archive.html',
    './favorites.html',
    './about.html',
    './contact.html',
    './detail.html',
    './library-detail.html',

    // CSS
    './src/css/style.css',
    './src/css/pages.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',

    // FontAwesome fontları
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.ttf',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.ttf',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.ttf',

    // Bootstrap JS
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',

    // JS
    './src/js/app.js',
    './src/js/ui.js',
    './src/js/api.js',
    './src/js/storage.js',
    './src/js/archive-logic.js',
    './src/js/library-detail.js',
    './src/js/detail-logic.js',
    'https://unpkg.com/dexie/dist/dexie.mjs',

    // İkonlar
    './public/icons/icons8-nasa-96.png',
    './public/icons/icons8-nasa-192.png',
    './public/icons/icons8-nasa-512.png',

    // Resimler
    './img/earth.jpg',
    './img/meteor.jpg',
    './img/sun.jpg',
    './img/favorites.jpg'
];

// INSTALL
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// ACTIVATE
self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (![CACHE_NAME, IMAGE_CACHE, API_CACHE].includes(key)) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

// FETCH
self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    if (req.destination === 'image' && !url.origin.includes(self.location.origin)) {
        event.respondWith(cacheFirst(req, IMAGE_CACHE));
        return;
    }

    if (url.host.includes('api.nasa.gov')) {
        event.respondWith(networkFirst(req, API_CACHE));
        return;
    }

    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;

            return fetch(req).catch(() => {
                if (req.mode === 'navigate') {
                    return caches.match('./offline.html');
                }
                return new Response('', { status: 503 });
            });
        })
    );
});

// FUNCTIONS
async function cacheFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
    } catch {
        return caches.match('./public/icons/icons8-nasa-96.png');
    }
}

async function networkFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
    } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
