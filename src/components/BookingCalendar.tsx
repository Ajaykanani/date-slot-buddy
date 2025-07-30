import React, { useCallback, useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar as CalendarIcon, User } from 'lucide-react';
import { isSameDay, addDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { BookingForm } from './BookingForm';
import { BookingDetails } from './BookingDetails';
import { environment } from '@/environments/environment.development';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/utils/dateUtils';

const { apiUrl } = environment;

export interface BookingData {
  id: string;
  dates: Date[];
  fullName: string;
  phoneNumber: string;
  price: number;
  otherDetails: string;
}

const BookingCalendar = () => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);

  const { language, setLanguage, t } = useLanguage();

  const renderLanguageSwitcher = () => (
    <div className="absolute top-4 right-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
      >
        {language === 'en' ? 'ગુજરાતી' : 'English'}
      </Button>
    </div>
  );

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/booking`);
      const result = await res.json();
      if (result.message === 'success' && Array.isArray(result.data)) {
        const formattedBookings: BookingData[] = result.data.map((booking) => ({
          id: booking._id,
          dates: booking.dates.map((date: string) => new Date(date)),
          fullName: booking.fullName,
          phoneNumber: booking.phone,
          price: booking.price,
          otherDetails: booking.details
        }));
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [language]);

  const isDateBooked = (date: Date) => {
    return bookings.some(booking => 
      booking.dates.some(bookingDate => isSameDay(bookingDate, date))
    );
  };

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => 
      booking.dates.some(bookingDate => isSameDay(bookingDate, date))
    );
  };

  const handleDateSelect = (date: Date) => {
    const existingBooking = getBookingForDate(date);
    if (existingBooking) {
      setSelectedBooking(existingBooking);
      setShowBookingDetails(true);
      return;
    }

    setSelectedDates(prev => {
      // If date is already selected, remove it
      if (prev.some(d => isSameDay(d, date))) {
        return prev.filter(d => !isSameDay(d, date));
      }
      
      // Add the date and sort them
      const newDates = [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      
      // Ensure dates are in sequence (consecutive)
      for (let i = 1; i < newDates.length; i++) {
        const prevDate = newDates[i - 1];
        const currDate = newDates[i];
        if (!isSameDay(addDays(prevDate, 1), currDate)) {
          alert('Please select consecutive dates only');
          return prev;
        }
      }
      
      return newDates;
    });
  };

  const handleBookDates = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData: Omit<BookingData, 'id' | 'dates'>) => {
    if (selectedDates.length === 0) return;
    
    const payload = {
      dates: selectedDates.map(date => formatDate(date, 'yyyy-MM-dd', language)),
      fullName: bookingData.fullName,
      phone: bookingData.phoneNumber,
      price: bookingData.price,
      details: bookingData.otherDetails || "",
    };
  
    try {
      if (editingBooking) {
        const res = await fetch(`${apiUrl}/booking/${editingBooking.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        const result = await res.json();
        if (result.message === 'success') {
          console.log('Booking updated successfully');
        }
      } else {
        const res = await fetch(`${apiUrl}/booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        const result = await res.json();
        if (result.message === 'success') {
          console.log('Booking created successfully');
        }
      }
  
      fetchBookings();
    } catch (error) {
      console.error('Booking submit error:', error);
    }
  
    setSelectedDates([]);
    setEditingBooking(null);
    setShowBookingForm(false);
  };

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleEditBooking = (booking: BookingData) => {
    setEditingBooking(booking);
    setSelectedDates(booking.dates);
    setShowBookingDetails(false);
    setShowBookingForm(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
        // DELETE /booking/:id (delete booking)
        const res = await fetch(`${apiUrl}/booking/${bookingId}`, {
          method: 'DELETE',
        });
  
        const result = await res.json();
        if (result.message === 'success') {
          console.log('Booking deleted successfully');
        } else {
          console.error('Error updating booking:', result);
        }
     
  
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Booking submit error:', error);
    }
    setShowBookingDetails(false);
    setSelectedBooking(null);
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="min-h-screen bg-background p-4">
      {renderLanguageSwitcher()}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
            {t('bookingSystem')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('selectDatesPrompt')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <Card className="shadow-lg border-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {t('selectDates')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedDates.length > 0 
                ? t('selectedDates').replace('{count}', selectedDates.length.toString())
                : t('clickToSelect')}
              </p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (dates) {
                    // Handle the last selected date
                    handleDateSelect(dates[dates.length - 1]);
                  }
                }}
                disabled={(date) => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  return date < today;
                }}
                className={cn("w-full pointer-events-auto")}
                modifiers={{
                  booked: (date) => isDateBooked(date),
                  selected: (date) => selectedDates.some(d => isSameDay(d, date))
                }}
                modifiersStyles={{
                  booked: { 
                    backgroundColor: 'hsl(var(--success))', 
                    color: 'hsl(var(--success-foreground))',
                    fontWeight: 'bold'
                  },
                  selected: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }
                }}
              />
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                  <span className="text-sm text-muted-foreground">{t('bookedDates')}</span>
                </div>
                <Button 
                  onClick={handleBookDates}
                  disabled={selectedDates.length === 0}
                  className="ml-auto"
                >
                  {t('bookSelectedDates')}
                </Button>
              </div>
              {selectedDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">{t('selectedDatesLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map((date) => (
                      <Badge key={date.toString()} variant="secondary">
                        {formatDate(date, 'MMM dd', language)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card className="shadow-lg border-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                {t('recentBookings')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t('viewBookings')}</p>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('noBookings')}</p>
                  <p className="text-sm text-muted-foreground">{t('createFirstBooking')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bookings
                    .sort((a, b) => b.dates[0].getTime() - a.dates[0].getTime())
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/30 to-accent/50 rounded-xl border border-accent/30 transition-all duration-200 hover:bg-accent/70 hover:shadow-md"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatDate(booking.dates[0], 'EEE MMM dd', language)}
                              {booking.dates.length > 1 && ` - ${formatDate(booking.dates[booking.dates.length - 1], 'EEE MMM dd, yyyy', language)}`}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {t('days').replace('{date}', booking.dates.length.toString())}
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
                            {t('details')}
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
            setSelectedDates([]);
            setEditingBooking(null);
          }}
          onSubmit={handleBookingSubmit}
          selectedDates={selectedDates}
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