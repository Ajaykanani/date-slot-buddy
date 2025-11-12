import { supabase, BookingRow } from '@/lib/supabase';
import { BookingData } from '@/components/BookingCalendar';

/**
 * Format date to YYYY-MM-DD in local timezone (not UTC)
 * This prevents timezone offset issues
 */
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetch all bookings from Supabase
 */
export const fetchBookings = async (): Promise<BookingData[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  // Transform Supabase data to BookingData format
  return (data || []).map((booking: BookingRow) => ({
    id: booking.id,
    dates: booking.dates.map((date: string) => new Date(date + 'T00:00:00')),
    fullName: booking.full_name,
    phoneNumber: booking.phone,
    price: booking.price,
    otherDetails: booking.details || '',
  }));
};

/**
 * Create a new booking
 */
export const createBooking = async (
  bookingData: Omit<BookingData, 'id'>
): Promise<BookingData> => {
  // Check if dates are already booked
  const isBooked = await checkDateAvailability(bookingData.dates);
  if (isBooked) {
    throw new Error('One or more selected dates are already booked');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      dates: bookingData.dates.map((date) => formatDateToLocal(date)),
      full_name: bookingData.fullName,
      phone: bookingData.phoneNumber,
      price: bookingData.price,
      details: bookingData.otherDetails || '',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return {
    id: data.id,
    dates: data.dates.map((date: string) => new Date(date + 'T00:00:00')),
    fullName: data.full_name,
    phoneNumber: data.phone,
    price: data.price,
    otherDetails: data.details || '',
  };
};

/**
 * Update an existing booking
 */
export const updateBooking = async (
  id: string,
  bookingData: Omit<BookingData, 'id'>
): Promise<BookingData> => {
  // Check if dates are already booked (excluding current booking)
  const isBooked = await checkDateAvailability(bookingData.dates, id);
  if (isBooked) {
    throw new Error('One or more selected dates are already booked by another booking');
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      dates: bookingData.dates.map((date) => formatDateToLocal(date)),
      full_name: bookingData.fullName,
      phone: bookingData.phoneNumber,
      price: bookingData.price,
      details: bookingData.otherDetails || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw error;
  }

  return {
    id: data.id,
    dates: data.dates.map((date: string) => new Date(date + 'T00:00:00')),
    fullName: data.full_name,
    phoneNumber: data.phone,
    price: data.price,
    otherDetails: data.details || '',
  };
};

/**
 * Delete a booking
 */
export const deleteBooking = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};

/**
 * Check if any of the given dates are already booked
 * @param dates - Array of dates to check
 * @param excludeBookingId - Optional booking ID to exclude from check (for updates)
 */
export const checkDateAvailability = async (
  dates: Date[],
  excludeBookingId?: string
): Promise<boolean> => {
  const dateStrings = dates.map((date) => formatDateToLocal(date));

  let query = supabase
    .from('bookings')
    .select('id, dates, full_name')
    .overlaps('dates', dateStrings);

  // Exclude the current booking when updating
  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking date availability:', error);
    throw error;
  }

  if (data && data.length > 0) {
    // Log which dates are conflicting for debugging
    console.log('Date conflict found:', data);
    const conflictingDates = new Set<string>();
    data.forEach((booking: any) => {
      booking.dates.forEach((date: string) => {
        if (dateStrings.includes(date)) {
          conflictingDates.add(date);
        }
      });
    });
    console.log('Conflicting dates:', Array.from(conflictingDates));
  }

  return data && data.length > 0;
};

