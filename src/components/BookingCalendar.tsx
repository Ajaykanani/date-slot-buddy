import React, { useCallback, useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Calendar as CalendarIcon, User, Filter } from 'lucide-react';
import { isSameDay, addDays, isAfter, isBefore, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { BookingForm } from './BookingForm';
import { BookingDetails } from './BookingDetails';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/utils/dateUtils';
import * as bookingService from '@/services/bookingService';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const { language, setLanguage, t } = useLanguage();

  // Get available months from bookings
  const getAvailableMonths = () => {
    const months = new Set<string>();
    bookings.forEach(booking => {
      booking.dates.forEach(date => {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      });
    });
    return Array.from(months).sort().reverse();
  };

  // Filter bookings by selected month
  const filteredBookings = bookings.filter(booking => {
    if (selectedMonth === 'all') return true;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));
    
    return booking.dates.some(date => 
      isWithinInterval(date, { start: startDate, end: endDate })
    );
  });

  // Format month for display
  const formatMonthDisplay = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return formatDate(date, 'MMMM yyyy', language);
  };

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
      const bookingsData = await bookingService.fetchBookings();
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to fetch bookings. Please check your Supabase configuration.');
    }
  }, []);

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
    
    const bookingPayload: Omit<BookingData, 'id'> = {
      dates: selectedDates,
      fullName: bookingData.fullName,
      phoneNumber: bookingData.phoneNumber,
      price: bookingData.price,
      otherDetails: bookingData.otherDetails || "",
    };
  
    try {
      if (editingBooking) {
        await bookingService.updateBooking(editingBooking.id, bookingPayload);
        console.log('Booking updated successfully');
      } else {
        await bookingService.createBooking(bookingPayload);
        console.log('Booking created successfully');
      }
  
      await fetchBookings();
    } catch (error) {
      console.error('Booking submit error:', error);
      alert(`Failed to ${editingBooking ? 'update' : 'create'} booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      await bookingService.deleteBooking(bookingId);
      console.log('Booking deleted successfully');
      
      // Refresh bookings
      await fetchBookings();
    } catch (error) {
      console.error('Booking delete error:', error);
      alert('Failed to delete booking. Please try again.');
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('viewBookings')}</p>
                {bookings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder={t('filterByMonth')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('allMonths')}</SelectItem>
                        {getAvailableMonths().map((monthKey) => (
                          <SelectItem key={monthKey} value={monthKey}>
                            {formatMonthDisplay(monthKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {bookings.length === 0 ? t('noBookings') : t('noBookingsForMonth')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bookings.length === 0 ? t('createFirstBooking') : t('tryDifferentMonth')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredBookings
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