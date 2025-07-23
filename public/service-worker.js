const STATIC_CACHE = 'majic-static-v6';
const DYNAMIC_CACHE = 'majic-dynamic-v6';
const OFFLINE_CACHE = 'majic-offline-v6';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/service-worker.js',
    '/images/icon.png',
    '/manifest.json',
    '/version.json'
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('🔧 Service Worker: Mise en cache des assets statiques');
                return cache.addAll(STATIC_ASSETS);
            })
    );
    // Ne pas forcer l'activation immédiate pour permettre la détection de mise à jour
    console.log('📦 Service Worker: Nouvelle version en cours d\'installation...');
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activation de la nouvelle version');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== OFFLINE_CACHE)
                .map(key => {
                    console.log(`🗑️ Service Worker: Suppression ancien cache: ${key}`);
                    return caches.delete(key);
                })
            );
        }).then(() => {
            // Notifier les clients qu'une nouvelle version est disponible
            console.log('📨 Service Worker: Notification nouvelle version disponible');
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
                });
            });
        })
    );
    // Prendre le contrôle des pages après notification
    return self.clients.claim();
});

// Fonction pour notifier l'application
const notifyClients = async () => {
    // Attendre un peu avant de notifier pour éviter les notifications au premier chargement
    await new Promise(resolve => setTimeout(resolve, 2000));
    const clients = await self.clients.matchAll({ type: 'window' });
    console.log('📢 Service Worker: Envoi notification mise à jour aux clients');
    clients.forEach(client => client.postMessage({ type: 'NEW_VERSION_AVAILABLE' }));
};

// Stratégie de fetch avec support offline avancé
self.addEventListener('fetch', event => {
    const { request } = event;

    // Stratégie Stale-While-Revalidate pour l'API avec cache hors-ligne étendu
    if (request.url.includes('/api/calendar')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(async networkResponse => {
                        if (networkResponse.ok) {
                            // Comparaison du contenu pour éviter les notifications inutiles
                            if (cachedResponse) {
                                try {
                                    const cachedText = await cachedResponse.clone().text();
                                    const networkText = await networkResponse.clone().text();
                                    
                                    // Ne notifier que si le contenu a vraiment changé
                                    if (cachedText !== networkText) {
                                        notifyClients();
                                    }
                                } catch (error) {
                                    console.log('Service Worker: Could not compare cache content:', error);
                                    // En cas d'erreur de comparaison, notifier quand même
                                    notifyClients();
                                }
                            }
                            cache.put(request, networkResponse.clone());
                            
                            // Sauvegarder également dans le cache offline (sans modification des headers)
                            caches.open(OFFLINE_CACHE).then(offlineCache => {
                                offlineCache.put(request, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    }).catch(error => {
                        console.log('📴 Service Worker: Réseau indisponible, utilisation cache offline');
                        // En cas d'échec réseau, essayer le cache offline
                        return caches.open(OFFLINE_CACHE).then(offlineCache => {
                            return offlineCache.match(request).then(offlineResponse => {
                                if (offlineResponse) {
                                    console.log('💾 Service Worker: Données récupérées depuis le cache offline');
                                    // Notifier qu'on est en mode hors-ligne
                                    self.clients.matchAll().then(clients => {
                                        clients.forEach(client => {
                                            client.postMessage({ type: 'OFFLINE_MODE', timestamp: Date.now() });
                                        });
                                    });
                                    return offlineResponse;
                                }
                                console.log('❌ Service Worker: Aucune donnée en cache disponible');
                                throw error;
                            });
                        });
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
                                try {
                                    const cachedText = await cachedResponse.clone().text();
                                    const networkText = await networkResponse.clone().text();
                                    
                                    // Notifier si le contenu a changé
                                    if (cachedText !== networkText) {
                                        console.log(`🔄 Service Worker: Fichier mis à jour: ${request.url}`);
                                        notifyClients();
                                    }
                                } catch (error) {
                                    console.log('⚠️ Service Worker: Erreur lors de la comparaison des assets:', error);
                                }
                            }
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(error => {
                        console.log('📁 Service Worker: Échec réseau pour asset statique, utilisation cache');
                        // En cas d'échec réseau pour assets statiques, utiliser le cache
                        return cachedResponse || caches.open(OFFLINE_CACHE).then(offlineCache => {
                            return offlineCache.match(request);
                        });
                    });
                    
                    // On retourne la réponse du cache immédiatement, ou on attend le réseau si pas de cache
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});