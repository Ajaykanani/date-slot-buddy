// Service Worker for Background Notifications
const CACHE_NAME = 'booking-notifications-v1';
const NOTIFICATION_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Periodic background sync to check for due notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkDueNotifications());
  }
});

// Remove notification from IndexedDB
async function removeNotification(notificationId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const deleteRequest = store.delete(notificationId);
      
      deleteRequest.onsuccess = () => {
        console.log(`Notification ${notificationId} removed after being shown`);
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error('Error removing notification:', deleteRequest.error);
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
}

// Helper function to get all items from a store
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Clean up old notifications that are past their booked date
async function cleanupOldNotifications() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const notifications = await getAllFromStore(store);
    const now = new Date();
    let cleanedCount = 0;

    for (const notification of notifications) {
      const bookedDate = new Date(notification.bookedDate);
      // Remove notifications where booked date has passed
      if (bookedDate < now) {
        await removeNotification(notification.id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old notifications`);
    }
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

// Check for due notifications
async function checkDueNotifications() {
  try {
    // First, clean up old notifications
    await cleanupOldNotifications();

    // Open IndexedDB
    const db = await openDB();
    const readTransaction = db.transaction(['notifications'], 'readonly');
    const readStore = readTransaction.objectStore('notifications');
    const index = readStore.index('notificationDate');
    const notifications = await getAllFromIndex(index);

    const now = new Date();
    const shownNotifications = [];
    const notificationsToRemove = [];

    // First pass: identify which notifications to show
    for (const notification of notifications) {
      const notificationDate = new Date(notification.notificationDate);
      const bookedDate = new Date(notification.bookedDate);

      // Only show if:
      // 1. Notification is due (notification date has passed)
      // 2. Booked date hasn't passed yet
      // 3. Notification hasn't been shown yet
      if (notificationDate <= now && now <= bookedDate && !notification.shown) {
        try {
          await self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: false,
            silent: false,
          });
          shownNotifications.push(notification.id);
          notificationsToRemove.push(notification.id);
        } catch (error) {
          console.error(`Error showing notification ${notification.id}:`, error);
        }
      }
    }

    // Second pass: remove all shown notifications in a single transaction
    if (notificationsToRemove.length > 0) {
      const writeTransaction = db.transaction(['notifications'], 'readwrite');
      const writeStore = writeTransaction.objectStore('notifications');
      
      await Promise.all(
        notificationsToRemove.map((id) => {
          return new Promise((resolve, reject) => {
            const deleteRequest = writeStore.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        })
      );
    }

    if (shownNotifications.length > 0) {
      console.log(`Showed and removed ${shownNotifications.length} due notifications`);
    }
  } catch (error) {
    console.error('Error checking due notifications:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
}

// Helper function to get all items from an index
function getAllFromIndex(index) {
  return new Promise((resolve, reject) => {
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Periodic check for notifications (every hour)
setInterval(() => {
  checkDueNotifications();
}, NOTIFICATION_CHECK_INTERVAL);

// Check immediately when service worker starts
checkDueNotifications();
