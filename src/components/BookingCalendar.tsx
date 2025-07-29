import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar as CalendarIcon, User } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { BookingForm } from './BookingForm';
import { BookingDetails } from './BookingDetails';

export interface BookingData {
  id: string;
  date: Date;
  fullName: string;
  phoneNumber: string;
  price: string;
  otherDetails: string;
}

const BookingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);

  const isDateBooked = (date: Date) => {
    return bookings.some(booking => isSameDay(booking.date, date));
  };

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => isSameDay(booking.date, date));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const existingBooking = getBookingForDate(date);
    if (existingBooking) {
      // If date is already booked, show details
      setSelectedBooking(existingBooking);
      setShowBookingDetails(true);
    } else {
      // If date is available, show booking form
      setSelectedDate(date);
      setShowBookingForm(true);
    }
  };

  const handleBookingSubmit = (bookingData: Omit<BookingData, 'id'>) => {
    if (editingBooking) {
      // Update existing booking
      const updatedBookings = bookings.map(booking => 
        booking.id === editingBooking.id 
          ? { ...bookingData, id: editingBooking.id }
          : booking
      );
      setBookings(updatedBookings);
      setEditingBooking(null);
    } else {
      // Create new booking
      const newBooking: BookingData = {
        ...bookingData,
        id: Date.now().toString()
      };
      setBookings([...bookings, newBooking]);
    }
    setShowBookingForm(false);
    setSelectedDate(undefined);
  };

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleEditBooking = (booking: BookingData) => {
    setEditingBooking(booking);
    setSelectedDate(booking.date);
    setShowBookingDetails(false);
    setShowBookingForm(true);
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings(bookings.filter(booking => booking.id !== bookingId));
    setShowBookingDetails(false);
    setSelectedBooking(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
            Date Booking System
          </h1>
          <p className="text-muted-foreground text-lg">
            Select an available date to make a booking or view existing bookings
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <Card className="shadow-lg border-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Select Date
              </CardTitle>
              <p className="text-sm text-muted-foreground">Click on any date to book or view details</p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                className={cn("w-full pointer-events-auto")}
                modifiers={{
                  booked: (date) => isDateBooked(date)
                }}
                modifiersStyles={{
                  booked: { 
                    backgroundColor: 'hsl(var(--success))', 
                    color: 'hsl(var(--success-foreground))',
                    fontWeight: 'bold'
                  }
                }}
              />
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Booked dates</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card className="shadow-lg border-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Recent Bookings
              </CardTitle>
              <p className="text-sm text-muted-foreground">View all booked dates and details</p>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No bookings yet</p>
                  <p className="text-sm text-muted-foreground">Select a date to create your first booking</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bookings
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/30 to-accent/50 rounded-xl border border-accent/30 transition-all duration-200 hover:bg-accent/70 hover:shadow-md"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {format(booking.date, 'MMM dd, yyyy')}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{booking.fullName}</p>
                          <p className="text-xs text-muted-foreground">{booking.phoneNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">₹{booking.price}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="mt-1 h-6 px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <BookingForm
          isOpen={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedDate(undefined);
            setEditingBooking(null);
          }}
          onSubmit={handleBookingSubmit}
          selectedDate={selectedDate}
          editingBooking={editingBooking}
        />

        <BookingDetails
          isOpen={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onEdit={() => selectedBooking && handleEditBooking(selectedBooking)}
          onDelete={() => selectedBooking && handleDeleteBooking(selectedBooking.id)}
        />
      </div>
    </div>
  );
};

export default BookingCalendar;