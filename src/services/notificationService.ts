import { BookingData } from '@/components/BookingCalendar';
import { subDays, format, isSameDay } from 'date-fns';
import { formatTimeToAMPM } from '@/utils/dateUtils';

export interface ScheduledNotification {
  id: string;
  bookingId: string;
  notificationDate: string; // ISO date string for when notification should fire
  bookedDate: string; // ISO date string of the actual booking date
  title: string;
  body: string;
  phoneNumber: string;
  fullName: string;
  price: number;
  otherDetails: string;
  allDateSlots: Array<{ date: string; startTime: string }>; // All dates in the booking
  shown?: boolean; // Track if notification has been displayed
  shownAt?: string; // ISO date string of when notification was shown
}

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission has been denied');
    return false;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Check if notification permission is granted
 */
export const hasNotificationPermission = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Calculate notification date (15 days before booked date)
 */
const calculateNotificationDate = (bookedDate: Date): Date => {
  return subDays(bookedDate, 15);
};

/**
 * Create notification body with all booking details
 */
const createNotificationBody = (
  booking: BookingData,
  targetDate: Date,
  targetTime: string
): string => {
  const timeDisplay = formatTimeToAMPM(targetTime);
  const dateDisplay = format(targetDate, 'MMM dd, yyyy');
  
  let body = `📅 Booking Reminder - ${dateDisplay} at ${timeDisplay} IST\n\n`;
  body += `👤 Name: ${booking.fullName}\n`;
  body += `📞 Phone: ${booking.phoneNumber}\n`;
  body += `💰 Price: ₹${booking.price.toFixed(2)}\n`;
  
  // Show all dates if multiple
  if (booking.dateSlots.length > 1) {
    body += `\n📆 All Booked Dates (${booking.dateSlots.length}):\n`;
    booking.dateSlots.forEach((slot, index) => {
      const slotDate = format(slot.date, 'MMM dd, yyyy');
      const slotTime = formatTimeToAMPM(slot.startTime);
      const isTargetDate = isSameDay(slot.date, targetDate);
      body += `${index + 1}. ${slotDate} at ${slotTime} IST${isTargetDate ? ' (This reminder)' : ''}\n`;
    });
  }
  
  // Add other details if available
  if (booking.otherDetails && booking.otherDetails.trim()) {
    body += `\n📝 Details: ${booking.otherDetails}`;
  }
  
  body += `\n\n⏰ This booking is coming up in 15 days!`;
  
  return body;
};

/**
 * Schedule a notification for a booking date
 */
const scheduleNotification = async (
  booking: BookingData,
  targetDate: Date,
  targetTime: string
): Promise<void> => {
  const notificationDate = calculateNotificationDate(targetDate);
  const now = new Date();

  // Only schedule if notification date is in the future
  if (notificationDate <= now) {
    console.log(`Skipping notification for past date: ${format(targetDate, 'yyyy-MM-dd')}`);
    return;
  }

  const notificationId = `${booking.id}-${format(targetDate, 'yyyy-MM-dd')}`;
  const title = `Booking Reminder - ${booking.fullName}`;
  const body = createNotificationBody(booking, targetDate, targetTime);

  // Store all date slots as ISO strings
  const allDateSlots = booking.dateSlots.map(slot => ({
    date: slot.date.toISOString(),
    startTime: slot.startTime
  }));

  // Store notification in IndexedDB
  await storeNotification({
    id: notificationId,
    bookingId: booking.id,
    notificationDate: notificationDate.toISOString(),
    bookedDate: targetDate.toISOString(),
    title,
    body,
    phoneNumber: booking.phoneNumber,
    fullName: booking.fullName,
    price: booking.price,
    otherDetails: booking.otherDetails || '',
    allDateSlots,
  });

  // For immediate testing (if notification is within 1 hour)
  const timeUntilNotification = notificationDate.getTime() - now.getTime();
  const oneHour = 60 * 60 * 1000;
  
  if (timeUntilNotification > 0 && timeUntilNotification < oneHour) {
    // Schedule for immediate testing (within 1 hour)
    setTimeout(() => {
      showNotification(title, body);
    }, timeUntilNotification);
  }

  // For longer-term scheduling, the service worker will check periodically
  // and show notifications when they're due
  console.log(`Notification scheduled for ${format(notificationDate, 'yyyy-MM-dd HH:mm')} (15 days before ${format(targetDate, 'yyyy-MM-dd')})`);
};

/**
 * Show a notification immediately
 */
const showNotification = (title: string, body: string): void => {
  if (!hasNotificationPermission()) {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: false,
      });
    });
  } else {
    // Fallback to regular Notification API
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
  }
};

/**
 * Store notification in IndexedDB
 */
const storeNotification = async (notification: ScheduledNotification): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3); // Increment version for schema update

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const addRequest = store.put(notification);

      addRequest.onsuccess = () => {
        console.log('Notification stored:', notification.id);
        resolve();
      };

      addRequest.onerror = () => {
        console.error('Error storing notification:', addRequest.error);
        reject(addRequest.error);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      } else {
        // If store exists, delete and recreate to update schema
        db.deleteObjectStore('notifications');
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
};

/**
 * Remove notifications for a booking
 */
export const removeNotificationsForBooking = async (bookingId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const index = store.index('bookingId');
      const getRequest = index.getAll(bookingId);

      getRequest.onsuccess = () => {
        const notifications = getRequest.result;
        notifications.forEach((notification) => {
          store.delete(notification.id);
        });
        console.log(`Removed ${notifications.length} notifications for booking ${bookingId}`);
        resolve();
      };

      getRequest.onerror = () => {
        console.error('Error removing notifications:', getRequest.error);
        reject(getRequest.error);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
};

/**
 * Schedule notifications for all dates in a booking
 * @param booking - The booking to schedule notifications for
 * @param forceReschedule - If true, will reschedule even if notifications already exist (default: false)
 */
export const scheduleBookingNotifications = async (
  booking: BookingData,
  forceReschedule: boolean = false
): Promise<void> => {
  if (!hasNotificationPermission()) {
    console.log('Notification permission not granted, skipping scheduling');
    return;
  }

  // Check if notifications already exist (unless forcing reschedule)
  if (!forceReschedule) {
    const alreadyScheduled = await hasNotificationsScheduled(booking.id);
    if (alreadyScheduled) {
      console.log(`Notifications already scheduled for booking ${booking.id}, skipping...`);
      return;
    }
  }

  // Remove old notifications for this booking first (if forcing reschedule or if they exist)
  await removeNotificationsForBooking(booking.id);

  // Schedule notifications for each date slot
  let scheduledSlots = 0;
  for (const slot of booking.dateSlots) {
    try {
      await scheduleNotification(
        booking,
        slot.date,
        slot.startTime
      );
      scheduledSlots++;
    } catch (error) {
      console.error(`Error scheduling notification for slot ${slot.date}:`, error);
    }
  }

  console.log(`✓ Scheduled ${scheduledSlots} notifications for booking ${booking.id} (${booking.dateSlots.length} date slots)`);
};

/**
 * Check if notifications have been scheduled for a booking
 */
const hasNotificationsScheduled = async (bookingId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('BookingNotifications', 3);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const index = store.index('bookingId');
      const getRequest = index.getAll(bookingId);

      getRequest.onsuccess = () => {
        resolve(getRequest.result.length > 0);
      };

      getRequest.onerror = () => {
        resolve(false);
      };
    };

    request.onerror = () => {
      resolve(false);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
};

/**
 * Schedule notifications for all existing bookings
 * This is useful when the app is deployed and there are already bookings in the database
 * It will only schedule for bookings that don't already have notifications scheduled
 */
export const scheduleNotificationsForAllBookings = async (
  bookings: BookingData[]
): Promise<void> => {
  if (!hasNotificationPermission()) {
    console.log('Notification permission not granted, skipping scheduling for existing bookings');
    return;
  }

  if (!bookings || bookings.length === 0) {
    console.log('No bookings to schedule notifications for');
    return;
  }

  console.log(`Checking ${bookings.length} existing bookings for notification scheduling...`);
  
  let scheduledCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const booking of bookings) {
    try {
      // Check if already scheduled before attempting
      const alreadyScheduled = await hasNotificationsScheduled(booking.id);
      
      if (alreadyScheduled) {
        skippedCount++;
        continue;
      }

      // Schedule notifications for this booking
      await scheduleBookingNotifications(booking, false);
      scheduledCount++;
    } catch (error) {
      console.error(`Error scheduling notifications for booking ${booking.id}:`, error);
      errorCount++;
    }
  }

  console.log(`Notification scheduling complete: ${scheduledCount} scheduled, ${skippedCount} already scheduled, ${errorCount} errors`);
};

/**
 * Mark a notification as shown and remove it from IndexedDB
 */
const markNotificationAsShownAndRemove = async (notificationId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

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

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
};

/**
 * Clean up old notifications that are past their booked date
 */
const cleanupOldNotifications = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const notifications = getAllRequest.result;
        const now = new Date();
        let cleanedCount = 0;

        notifications.forEach((notification) => {
          const bookedDate = new Date(notification.bookedDate);
          // Remove notifications where booked date has passed
          if (bookedDate < now) {
            store.delete(notification.id);
            cleanedCount++;
          }
        });

        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} old notifications`);
        }
        resolve();
      };

      getAllRequest.onerror = () => {
        console.error('Error cleaning up notifications:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
};

/**
 * Check and show due notifications
 */
export const checkAndShowDueNotifications = async (): Promise<void> => {
  if (!hasNotificationPermission()) {
    return;
  }

  // First, clean up old notifications
  await cleanupOldNotifications();

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookingNotifications', 3);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const index = store.index('notificationDate');
      const getAllRequest = index.getAll();

      getAllRequest.onsuccess = async () => {
        const notifications = getAllRequest.result;
        const now = new Date();
        const shownNotifications: string[] = [];
        const notificationsToRemove: string[] = [];

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
              showNotification(notification.title, notification.body);
              shownNotifications.push(notification.id);
              notificationsToRemove.push(notification.id);
            } catch (error) {
              console.error(`Error showing notification ${notification.id}:`, error);
            }
          }
        }

        // Second pass: remove all shown notifications in a single transaction
        if (notificationsToRemove.length > 0) {
          const removeTransaction = db.transaction(['notifications'], 'readwrite');
          const removeStore = removeTransaction.objectStore('notifications');
          
          await Promise.all(
            notificationsToRemove.map((id) => {
              return new Promise<void>((resolve, reject) => {
                const deleteRequest = removeStore.delete(id);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
            })
          );
        }

        if (shownNotifications.length > 0) {
          console.log(`Showed and removed ${shownNotifications.length} due notifications`);
        }

        resolve();
      };

      getAllRequest.onerror = () => {
        console.error('Error checking notifications:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
        objectStore.createIndex('bookingId', 'bookingId', { unique: false });
        objectStore.createIndex('notificationDate', 'notificationDate', { unique: false });
      }
    };
  });
};
