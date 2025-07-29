import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, Phone, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { BookingData } from './BookingCalendar';

const bookingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  price: z.string()
    .regex(/^\d+$/, 'Price must be a valid number')
    .refine((val) => parseInt(val) > 0, 'Price must be greater than 0'),
  otherDetails: z.string().optional()
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<BookingData, 'id'>) => void;
  selectedDate?: Date;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedDate
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema)
  });

  const handleFormSubmit = (data: BookingFormData) => {
    if (!selectedDate) return;
    
    onSubmit({
      date: selectedDate,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      price: data.price,
      otherDetails: data.otherDetails || ''
    });
    
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Book Date: {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Enter your full name"
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber')}
              placeholder="Enter 10-digit mobile number"
              type="tel"
              maxLength={10}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price
            </Label>
            <Input
              id="price"
              {...register('price')}
              placeholder="Enter amount in rupees"
              type="number"
              min="1"
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherDetails" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Other Details (Optional)
            </Label>
            <Textarea
              id="otherDetails"
              {...register('otherDetails')}
              placeholder="Any additional information..."
              rows={3}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary-glow">
              Book Date
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};