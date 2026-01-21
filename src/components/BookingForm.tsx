import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, Phone, IndianRupee, FileText, Clock } from 'lucide-react';
import { BookingData } from './BookingCalendar';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/utils/dateUtils';

const bookingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number with up to 2 decimal places')
    .refine((val) => parseFloat(val) > 0, 'Price must be greater than 0'),
  otherDetails: z.string().optional()
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<BookingData, 'id'>) => void;
  selectedDates?: Date[];
  editingBooking?: BookingData | null;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedDates = [],
  editingBooking
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema)
  });

  // State to track times for each date
  const [dateTimes, setDateTimes] = React.useState<Map<string, string>>(new Map());

  // Helper to get date key without timezone conversion
  const getDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Create a stable string representation of date keys for comparison
  const selectedDateKeysString = React.useMemo(() => {
    return selectedDates.map(date => getDateKey(date)).sort().join(',');
  }, [selectedDates]);

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editingBooking) {
      setValue('fullName', editingBooking.fullName);
      setValue('phoneNumber', editingBooking.phoneNumber);
      setValue('price', String(editingBooking.price));
      setValue('otherDetails', editingBooking.otherDetails);

      // Pre-fill times from editing booking
      const timesMap = new Map<string, string>();
      editingBooking.dateSlots.forEach(slot => {
        const dateKey = getDateKey(slot.date);
        timesMap.set(dateKey, slot.startTime);
      });
      setDateTimes(timesMap);
    } else {
      reset();
      // Only reset times if we're not editing
      if (!editingBooking) {
        setDateTimes(new Map());
      }
    }
  }, [editingBooking, setValue, reset]);

  // Initialize times ONLY for NEW dates that don't have a time yet
  React.useEffect(() => {
    if (!editingBooking && selectedDates.length > 0) {
      setDateTimes(prev => {
        const newTimes = new Map(prev);
        let hasChanges = false;

        selectedDates.forEach(date => {
          const dateKey = getDateKey(date);
          // ONLY set default if this date doesn't exist in our times map
          // This ensures we never overwrite user-entered times
          if (!newTimes.has(dateKey)) {
            newTimes.set(dateKey, '00:00'); // Default time (IST midnight) - only for new dates
            hasChanges = true;
          }
        });

        // Only update state if we actually added new dates
        return hasChanges ? newTimes : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKeysString, editingBooking]); // Use the memoized string for comparison (selectedDates is included via selectedDateKeysString)

  const handleTimeChange = React.useCallback((date: Date, time: string) => {
    const dateKey = getDateKey(date);
    // Preserve the exact time value entered by the user - no conversion, no default
    setDateTimes(prev => {
      const newMap = new Map(prev);
      // Store exactly what user entered - even if empty string
      newMap.set(dateKey, time || '00:00');
      return newMap;
    });
  }, []);

  const handleFormSubmit = (data: BookingFormData) => {
    if (!selectedDates || selectedDates.length === 0) return;

    // Validate that all dates have times
    const missingTimes = selectedDates.filter(date => {
      const dateKey = getDateKey(date);
      return !dateTimes.get(dateKey);
    });

    if (missingTimes.length > 0) {
      alert('Please provide start time for all selected dates');
      return;
    }

    // Create date slots with times - use exactly what user entered
    const dateSlots = selectedDates.map(date => {
      const dateKey = getDateKey(date);
      const time = dateTimes.get(dateKey);
      if (!time) {
        alert(`Please provide start time for ${formatDate(date, 'MMM dd', language)}`);
        throw new Error('Missing time for date');
      }
      return {
        date,
        startTime: time // Use exactly what user entered, no default conversion
      };
    });

    onSubmit({
      dateSlots,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      price: parseFloat(data.price),
      otherDetails: data.otherDetails || ''
    });

    reset();
    setDateTimes(new Map());
  };

  const handleClose = () => {
    reset();
    setDateTimes(new Map());
    onClose();
  };

  const { language, t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {editingBooking ? t('editBooking') : t('bookDate')}
          </DialogTitle>
        </DialogHeader>

        {selectedDates.length > 0 && (
          <div className="mb-4 space-y-3">
            <p className="text-sm font-medium mb-2">{t('selectedDatesLabel')}</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDates.map((date) => {
                const dateKey = getDateKey(date);
                const time = dateTimes.get(dateKey) || '00:00';
                // Use a stable key based on date key to prevent React from recreating the input
                return (
                  <div key={dateKey} className="flex items-center gap-2 p-2 border rounded-lg">
                    <Badge variant="secondary" className="flex-1">
                      {formatDate(date, 'MMM dd', language)}
                    </Badge>
                    <div className="flex items-center gap-2 flex-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTime = e.target.value;
                          // Immediately update state with user's input - no delay, no conversion
                          handleTimeChange(date, newTime);
                        }}
                        className="w-32"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('daysTotal').replace('{count}', String(selectedDates.length)).replace('{s}', selectedDates.length > 1 ? 's' : '')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('fullName')}
            </Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder={t('enterFullName')}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('phoneNumber')}
            </Label>
            <Input
              id="phoneNumber"
              placeholder={t('enterPhone')}
              type="tel"
              maxLength={10}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Phone number must be exactly 10 digits',
                },
              })}
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                input.value = input.value.replace(/[^0-9]/g, '');
              }}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              {t('price')}
            </Label>
            <Input
              id="price"
              {...register('price')}
              placeholder={t('enterAmount')}
              type="number"
              min="0"
              step="0.01"
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherDetails" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('otherDetails')}
            </Label>
            <Textarea
              id="otherDetails"
              {...register('otherDetails')}
              placeholder={t('additionalInfo')}
              rows={3}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary-glow">
              {editingBooking ? t('updateBooking') : t('bookDate')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};