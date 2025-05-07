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
  // event.respondWith(
  //   caches.match(event.request).then(response => {
  //     return response || fetch(event.request);
  //   })
  // );
});

// Push Notification
self.addEventListener('push', event => {
  console.log('Service Worker receives push', event.data.url);
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new message!',
    icon: '/vite.svg', // Path to your app icon
    badge: '/vite.svg', // Path to a smaller badge icon
    data: {
      url: data.url || '/', // Add a URL to open when the notification is clicked
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(err => {
      console.error('Notification error:', err);
    })
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetURL = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const targetDomain = new URL(targetURL).origin;

        for (const client of clientList) {
          const clientDomain = new URL(client.url).origin;

          if (clientDomain === targetDomain && 'focus' in client) {
            return client.navigate(targetURL).then(() => client.focus());
          }
        }

        clients.openWindow(targetURL);
      })
      .catch(err => {
        console.error('Error handling notification click:', err);
      })
  );
});
