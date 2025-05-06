self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open('static-cache').then(cache => {
      return cache.addAll([
        '/', // Cache the root URL
        '/index.html', // Cache the HTML
        '/vite.svg', // Cache the app icon
        // Add other static assets here
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Push Notification
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new message!',
    icon: '/vite.svg', // Path to your app icon
    badge: '/vite.svg', // Path to a smaller badge icon
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
