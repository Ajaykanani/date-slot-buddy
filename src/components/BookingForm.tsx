import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, Phone, IndianRupee, FileText } from 'lucide-react';
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

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editingBooking) {
      setValue('fullName', editingBooking.fullName);
      setValue('phoneNumber', editingBooking.phoneNumber);
      setValue('price', String(editingBooking.price));
      setValue('otherDetails', editingBooking.otherDetails);
    } else {
      reset();
    }
  }, [editingBooking, setValue, reset]);

  const handleFormSubmit = (data: BookingFormData) => {
    if (!selectedDates || selectedDates.length === 0) return;

    onSubmit({
      dates: selectedDates,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      price: parseFloat(data.price),
      otherDetails: data.otherDetails || ''
    });

    reset();
  };

  const handleClose = () => {
    reset();
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
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">{t('selectedDatesLabel')}</p>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date) => (
                <Badge key={date.toString()} variant="secondary">
                  {formatDate(date, 'MMM dd', language)}
                </Badge>
              ))}
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