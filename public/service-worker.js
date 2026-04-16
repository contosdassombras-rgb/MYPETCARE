importScripts("https://js.pusher.com/beams/service-worker.js");

// ─── Push Notification Handler ────────────────────────────────────────
self.addEventListener('push', function(event) {
  let data = { title: 'MyPetCare', body: 'Você tem uma notificação!' };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      // Pusher Beams format
      if (payload.notification) {
        data = payload.notification;
      } else {
        data = { ...data, ...payload };
      }
    }
  } catch (e) {
    console.warn('[SW] Push data parse error:', e);
  }

  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'mypetcare-notification',
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MyPetCare', options)
  );
});

// ─── Click handler ────────────────────────────────────────────────────
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ─── Activate and claim clients ───────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
