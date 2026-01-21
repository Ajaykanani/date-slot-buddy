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
import { DateBookingsDialog } from './DateBookingsDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/utils/dateUtils';
import * as bookingService from '@/services/bookingService';

export interface DateSlot {
  date: Date;
  startTime: string; // Format: HH:mm
}

export interface BookingData {
  id: string;
  dateSlots: DateSlot[]; // Array of date-time pairs
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
  const [showDateBookingsDialog, setShowDateBookingsDialog] = useState(false);
  const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const { language, setLanguage, t } = useLanguage();

  // Get available months from bookings
  const getAvailableMonths = () => {
    const months = new Set<string>();
    bookings.forEach(booking => {
      booking.dateSlots.forEach(slot => {
        const monthKey = `${slot.date.getFullYear()}-${String(slot.date.getMonth() + 1).padStart(2, '0')}`;
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

    return booking.dateSlots.some(slot =>
      isWithinInterval(slot.date, { start: startDate, end: endDate })
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
      booking.dateSlots.some(slot => isSameDay(slot.date, date))
    );
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking =>
      booking.dateSlots.some(slot => isSameDay(slot.date, date))
    );
  };

  const handleDateSelect = (date: Date) => {
    // If date is already booked, show the bookings dialog
    if (isDateBooked(date)) {
      setSelectedDateForDialog(date);
      setShowDateBookingsDialog(true);
      return;
    }

    // If date is not booked, add to selection
    setSelectedDates(prev => {
      // If date is already selected, remove it
      if (prev.some(d => isSameDay(d, date))) {
        return prev.filter(d => !isSameDay(d, date));
      }

      // Add the date and sort them
      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
  };

  const handleBookDates = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData: Omit<BookingData, 'id'>) => {
    try {
      if (editingBooking) {
        await bookingService.updateBooking(editingBooking.id, bookingData);
        console.log('Booking updated successfully');
      } else {
        await bookingService.createBooking(bookingData);
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
    setSelectedDates(booking.dateSlots.map(slot => slot.date));
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

  const handleAddBookingForDate = () => {
    if (selectedDateForDialog) {
      setSelectedDates([selectedDateForDialog]);
      setShowDateBookingsDialog(false);
      setShowBookingForm(true);
    }
  };

  const handleEditBookingFromDialog = (booking: BookingData) => {
    setEditingBooking(booking);
    setSelectedDates(booking.dateSlots.map(slot => slot.date));
    setShowDateBookingsDialog(false);
    setShowBookingForm(true);
  };

  const handleDeleteBookingFromDialog = async (bookingId: string) => {
    try {
      await bookingService.deleteBooking(bookingId);
      console.log('Booking deleted successfully');

      // Refresh bookings
      await fetchBookings();
    } catch (error) {
      console.error('Booking delete error:', error);
      alert('Failed to delete booking. Please try again.');
    }
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
                    .sort((a, b) => b.dateSlots[0].date.getTime() - a.dateSlots[0].date.getTime())
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/30 to-accent/50 rounded-xl border border-accent/30 transition-all duration-200 hover:bg-accent/70 hover:shadow-md"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {booking.dateSlots.length === 1 ? (
                                // Single date-time
                                `${formatDate(booking.dateSlots[0].date, 'EEE MMM dd', language)} ${booking.dateSlots[0].startTime} IST`
                              ) : (
                                // Date-time range
                                `${formatDate(booking.dateSlots[0].date, 'EEE MMM dd', language)} ${booking.dateSlots[0].startTime} IST - ${formatDate(booking.dateSlots[booking.dateSlots.length - 1].date, 'EEE MMM dd, yyyy', language)} ${booking.dateSlots[booking.dateSlots.length - 1].startTime} IST`
                              )}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {t('days').replace('{date}', booking.dateSlots.length.toString())}
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

        <DateBookingsDialog
          isOpen={showDateBookingsDialog}
          onClose={() => {
            setShowDateBookingsDialog(false);
            setSelectedDateForDialog(null);
          }}
          date={selectedDateForDialog}
          bookings={bookings}
          onAdd={handleAddBookingForDate}
          onEdit={handleEditBookingFromDialog}
          onDelete={handleDeleteBookingFromDialog}
        />
      </div>
    </div>
  );
};

export default BookingCalendar;