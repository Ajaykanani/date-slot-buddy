import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Phone, IndianRupee, FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { BookingData } from './BookingCalendar';

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
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Booking Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Badge */}
          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {format(booking.date, 'EEEE, MMMM dd, yyyy')}
            </Badge>
          </div>

          <Separator />

          {/* Booking Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">Full Name</p>
                <p className="font-semibold">{booking.fullName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">Phone Number</p>
                <p className="font-semibold">{booking.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IndianRupee className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">Price</p>
                <p className="font-semibold text-lg text-primary">₹{booking.price}</p>
              </div>
            </div>

            {booking.otherDetails && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground">Other Details</p>
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
              Edit
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
          
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};