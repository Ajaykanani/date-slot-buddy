import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { requestNotificationPermission, hasNotificationPermission, scheduleNotificationsForAllBookings } from '@/services/notificationService';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookingData } from './BookingCalendar';

interface NotificationPermissionProps {
  bookings?: BookingData[];
  onPermissionGranted?: () => void;
}

export const NotificationPermission: React.FC<NotificationPermissionProps> = ({ 
  bookings = [],
  onPermissionGranted 
}) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setPermissionGranted(hasNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (granted) {
        console.log('Notification permission granted');
        // Schedule notifications for all existing bookings
        if (bookings && bookings.length > 0) {
          console.log(`Scheduling notifications for ${bookings.length} existing bookings...`);
          await scheduleNotificationsForAllBookings(bookings);
        }
        // Notify parent component
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if permission is already granted
  if (permissionGranted) {
    return null;
  }

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-5 h-5 text-primary" />
          Enable Notifications
        </CardTitle>
        <CardDescription className="text-sm">
          Get reminders 15 days before your booked dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleRequestPermission}
          disabled={isRequesting}
          className="w-full"
          variant="default"
        >
          {isRequesting ? 'Requesting...' : 'Enable Notifications'}
        </Button>
        {!permissionGranted && Notification.permission === 'denied' && (
          <p className="text-xs text-muted-foreground mt-2">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
