importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
firebase.initializeApp({
  apiKey: "AIzaSyCLIkZiiLCtgux7faHH4e2_z8LAG4omEiY",
  authDomain: "kreatorkolkata.firebaseapp.com",
  databaseURL: "https://kreatorkolkata-default-rtdb.firebaseio.com",
  projectId: "kreatorkolkata",
  storageBucket: "kreatorkolkata.firebasestorage.app",
  messagingSenderId: "882651352678",
  appId: "1:882651352678:web:5ec49cb746ba88ff2fa7a7",
  measurementId: "G-46DJKQ74CE",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || "Kreator Kolkata";
  const clickAction = payload.data?.click_action || payload.data?.link || '/';
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.image || '/icon.png',
    data: {
      click_action: clickAction,
      ...payload.data,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus tab or open link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.click_action || event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(clickAction);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
