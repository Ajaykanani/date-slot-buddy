import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Phone, IndianRupee, FileText, Edit, Trash2 } from 'lucide-react';
import { BookingData } from './BookingCalendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/utils/dateUtils';

interface BookingDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingData | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({
  isOpen,
  onClose,
  booking,
  onEdit,
  onDelete
}) => {
  const { language, t } = useLanguage();
  if (!booking) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('bookingDetails')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Badge */}
          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {formatDate(booking.dates[0], 'MMM dd', language)}
              {booking.dates.length > 1 && ` - ${formatDate(booking.dates[booking.dates.length - 1], 'MMM dd, yyyy', language)}`}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
            {t('days').replace('{date}', booking.dates.length.toString())}
            </p>
          </div>

          {/* Show all dates in a scrollable list */}
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
            <div className="grid grid-cols-2 gap-2">
              {booking.dates.map((date) => (
                <Badge 
                  key={date.toString()} 
                  variant="outline" 
                  className="text-sm justify-start"
                >
                  {formatDate(date, 'EEE, MMM dd', language)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Booking Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">{t('fullName')}</p>
                <p className="font-semibold">{booking.fullName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">{t('phoneNumber')}</p>
                <p className="font-semibold">{booking.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IndianRupee className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">{t('price')}</p>
                <p className="font-semibold text-lg text-primary">₹{booking.price}</p>
              </div>
            </div>

            {booking.otherDetails && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground">{t('otherDetailsOnly')}</p>
                  <p className="text-sm bg-accent/50 p-3 rounded-lg mt-1">
                    {booking.otherDetails}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button variant="outline" onClick={onEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete')}
            </Button>
          </div>
          
          <Button variant="secondary" onClick={onClose} className="w-full">
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};