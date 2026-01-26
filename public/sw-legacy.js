// LEGACY SERVICE WORKER - KEPT FOR REFERENCE
// This file is now replaced by the dynamic service worker served at /api/sw
// The new version automatically updates cache names on each deployment to Vercel

// This is the service worker for Gold Price App

// Skip caching in development mode
const IS_DEVELOPMENT = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

const CACHE_NAME = 'gold-price-app-v3';
const API_CACHE = 'api-cache';
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/apple-icon.png',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
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
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS);
    }),
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log('Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            }),
          );
        }),
      // Take control of all clients
      self.clients.claim(),
    ]),
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Skip SW handling entirely in development
  if (IS_DEVELOPMENT) {
    return;
  }

  // Always bypass cache for API requests (dynamic data)
  if (event.request.url.includes('/api/gold-prices-egp')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(API_CACHE).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: 'Offline or network error' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          }),
      ),
    );
    return;
  }

  // Only handle GET requests for static assets
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response since it can only be consumed once
          const responseToCache = response.clone();

          // Open cache and store the new response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If fetch fails (e.g., offline), try to return a fallback page
          // For API requests, you might want to show an offline message
          if (event.request.url.includes('/api/')) {
            return new Response(JSON.stringify({ error: 'You are offline' }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // For page navigation, you could return a simple offline page
          return caches.match('/');
        });
    }),
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      let data;
      let title = 'Gold Price Update';
      let body = 'New gold price update!';

      // Try to parse as JSON first
      try {
        data = event.data.json();
        title = data.title || title;
        body = data.body || body;
      } catch (_jsonError) {
        // If JSON parsing fails, treat as plain text
        console.log('Push data is not JSON, treating as plain text');
        body = event.data.text() || body;
      }

      const options = {
        body: body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '1',
        },
        tag: 'gold-price-notification', // Prevent duplicate notifications
        requireInteraction: false,
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
      console.error('Error showing notification:', error);

      // Fallback notification if everything fails
      event.waitUntil(
        self.registration.showNotification('Gold Price Update', {
          body: 'Failed to parse notification data',
          icon: '/icons/icon-192x192.png',
        }),
      );
    }
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Allow the app to trigger SW updates programmatically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
