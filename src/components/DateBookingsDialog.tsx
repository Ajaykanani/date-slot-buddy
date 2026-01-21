import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Edit, Trash2, Plus, Clock } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { BookingData } from './BookingCalendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate, formatTimeToAMPM } from '@/utils/dateUtils';

interface DateBookingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  bookings: BookingData[];
  onAdd: () => void;
  onEdit: (booking: BookingData) => void;
  onDelete: (bookingId: string) => void;
}

export const DateBookingsDialog: React.FC<DateBookingsDialogProps> = ({
  isOpen,
  onClose,
  date,
  bookings,
  onAdd,
  onEdit,
  onDelete
}) => {
  const { language, t } = useLanguage();
  
  if (!date) return null;

  // Filter bookings that have this date
  const dateBookings = bookings.filter(booking =>
    booking.dateSlots.some(slot => isSameDay(slot.date, date))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {formatDate(date, 'EEEE, MMMM dd, yyyy', language)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add New Booking Button */}
          <Button 
            onClick={onAdd} 
            className="w-full bg-gradient-to-r from-primary to-primary-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addBooking') || 'Add New Booking'}
          </Button>

          <Separator />

          {/* Bookings List */}
          {dateBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('noBookingsForDate') || 'No bookings for this date'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dateBookings.map((booking) => {
                // Get the slot for this specific date
                const dateSlot = booking.dateSlots.find(slot => isSameDay(slot.date, date));

                return (
                  <div
                    key={booking.id}
                    className="p-4 border rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {dateSlot?.startTime ? `${formatTimeToAMPM(dateSlot.startTime)} IST` : 'N/A'}
                          </Badge>
                        </div>
                        <p className="font-semibold text-sm">{booking.fullName}</p>
                        <p className="text-xs text-muted-foreground">{booking.phoneNumber}</p>
                        <p className="text-sm font-medium text-primary mt-1">₹{booking.price}</p>
                      </div>
                    </div>

                    {/* Show all slots if booking has multiple dates */}
                    {booking.dateSlots.length > 1 && (
                      <div className="mb-3 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          {t('allDates') || 'All dates in this booking:'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {booking.dateSlots.map((slot, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {formatDate(slot.date, 'MMM dd, yyyy', language)} {formatTimeToAMPM(slot.startTime)} IST
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.otherDetails && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {booking.otherDetails}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(booking)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(booking.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <Separator />
          
          <Button variant="secondary" onClick={onClose} className="w-full">
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
