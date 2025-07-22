const STATIC_CACHE = 'majic-static-v3';
const DYNAMIC_CACHE = 'majic-dynamic-v3';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/service-worker.js',
    '/images/icon.png',
    '/manifest.json'
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                .map(key => {
                    console.log(`Service Worker: Deleting old cache: ${key}`);
                    return caches.delete(key);
                })
            );
        })
    );
});

// Fonction pour notifier l'application
const notifyClients = async () => {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.postMessage({ type: 'NEW_VERSION_AVAILABLE' }));
};

// Stratégie de fetch
self.addEventListener('fetch', event => {
    const { request } = event;

    // Stratégie Stale-While-Revalidate pour l'API
    if (request.url.includes('/api/calendar')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(async networkResponse => {
                        if (networkResponse.ok) {
                            // Comparaison du contenu pour éviter les notifications inutiles
                            if (cachedResponse) {
                                const cachedText = await cachedResponse.text();
                                const networkText = await networkResponse.clone().text();
                                
                                // Ne notifier que si le contenu a vraiment changé
                                if (cachedText !== networkText) {
                                    notifyClients();
                                }
                            }
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                    // On retourne la réponse du cache immédiatement, ou on attend le réseau si pas de cache
                    return cachedResponse || fetchPromise;
                });
            })
        );
    } else {
        // Stratégie Stale-While-Revalidate pour tous les assets statiques
        event.respondWith(
            caches.open(STATIC_CACHE).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(async networkResponse => {
                        if (networkResponse.ok) {
                            // Comparaison du contenu pour détecter les changements
                            if (cachedResponse) {
                                const cachedText = await cachedResponse.text();
                                const networkText = await networkResponse.clone().text();
                                
                                // Notifier si le contenu a changé
                                if (cachedText !== networkText) {
                                    console.log(`Service Worker: File updated: ${request.url}`);
                                    notifyClients();
                                }
                            }
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                    // On retourne la réponse du cache immédiatement, ou on attend le réseau si pas de cache
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});