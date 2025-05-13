// This is the service worker for Gold Price App

// Skip caching in development mode
const IS_DEVELOPMENT = self.location.hostname === 'localhost' || 
                       self.location.hostname === '127.0.0.1';

const CACHE_NAME = 'gold-price-app-v1';
const ASSETS = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/site.webmanifest',
  '/manifest.json'
];

// When the service worker is installed
self.addEventListener('install', (event) => {
  // Skip waiting so the new service worker activates immediately
  self.skipWaiting();
  
  // Only cache assets in production
  if (IS_DEVELOPMENT) {
    console.log('Development mode: Skipping cache');
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  
  if (IS_DEVELOPMENT) {
    console.log('Development mode: Skipping cache cleanup');
    return;
  }
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Skip caching in development
  if (IS_DEVELOPMENT) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();

            // Open cache and store the new response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'New gold price update!',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '1'
        }
      };
      event.waitUntil(
        self.registration.showNotification(data.title || 'Gold Price Update', options)
      );
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
}); 