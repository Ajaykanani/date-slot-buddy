import { supabase, BookingRow } from '@/lib/supabase';
import { BookingData } from '@/components/BookingCalendar';

/**
 * Format datetime to ISO string with IST timezone (GMT+0530)
 * ALWAYS includes time component - never stores date-only format
 * @param date - Date object
 * @param time - Time string in HH:mm format (defaults to '00:00' if not provided)
 * @returns ISO datetime string with IST timezone (YYYY-MM-DDTHH:mm:ss+05:30)
 * Example: "2026-01-24T01:20:00+05:30"
 */
const formatDateTimeToIST = (date: Date, time: string): string => {
  // Use local date components to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // Ensure time format is HH:mm (remove seconds if present, default to 00:00)
  const timePart = time && time.includes(':') ? time.split(':').slice(0, 2).join(':') : '00:00';
  // ALWAYS format as ISO string with IST timezone offset (+05:30) - includes time component
  return `${year}-${month}-${day}T${timePart}:00+05:30`;
};

/**
 * Parse datetime string from database (with IST timezone)
 * Handles both old format (date only: "2026-01-21") and new format (datetime: "2026-01-21T01:20:00+05:30")
 * @param dateTimeStr - ISO datetime string or date-only string
 * @returns Object with date and time in IST (defaults to 00:00 for old date-only format)
 */
const parseDateTimeFromIST = (dateTimeStr: string): { date: Date; startTime: string } => {
  let datePart: string;
  let timePart: string = '00:00:00'; // Default to 00:00 IST for old data
  
  // Check if it's the old format (date only, like "2026-01-21")
  if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Old format: date only - default to 00:00 IST
    datePart = dateTimeStr;
    timePart = '00:00:00';
  } else if (dateTimeStr.includes('+05:30') || dateTimeStr.includes('+0530')) {
    // New format: Has IST timezone offset
    const parts = dateTimeStr.split('T');
    datePart = parts[0];
    timePart = parts[1] ? parts[1].split('+')[0].split('-')[0] : '00:00:00';
  } else if (dateTimeStr.includes('T')) {
    // ISO format without timezone
    [datePart, timePart] = dateTimeStr.split('T');
    timePart = timePart ? timePart.split('+')[0].split('-')[0].split('Z')[0] : '00:00:00';
  } else {
    // Fallback: treat as date only
    datePart = dateTimeStr;
    timePart = '00:00:00';
  }
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];
  
  // Create date in local timezone (IST) - this ensures no UTC conversion
  const date = new Date(year, month - 1, day, hours, minutes, 0);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  
  return {
    date,
    startTime: timeStr
  };
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

  // Transform Supabase data to BookingData format (treating all dates as IST)
  return (data || []).map((booking: BookingRow) => ({
    id: booking.id,
    dateSlots: booking.dates.map((dateTimeStr: string) => parseDateTimeFromIST(dateTimeStr)),
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
  // Check if date-time slots are already booked
  const isBooked = await checkDateTimeAvailability(bookingData.dateSlots);
  if (isBooked) {
    throw new Error('One or more selected date-time slots are already booked');
  }

  // Format all date-time slots with time component
  const dateTimeStrings = bookingData.dateSlots.map((slot) => formatDateTimeToIST(slot.date, slot.startTime));
  
  // Log for debugging - remove in production
  console.log('Storing datetime strings:', dateTimeStrings);
  
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      dates: dateTimeStrings, // Array of datetime strings: ["2026-01-24T01:20:00+05:30", ...]
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
    dateSlots: data.dates.map((dateTimeStr: string) => parseDateTimeFromIST(dateTimeStr)),
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
  // Check if date-time slots are already booked (excluding current booking)
  const isBooked = await checkDateTimeAvailability(bookingData.dateSlots, id);
  if (isBooked) {
    throw new Error('One or more selected date-time slots are already booked by another booking');
  }

  // Format all date-time slots with time component
  const dateTimeStrings = bookingData.dateSlots.map((slot) => formatDateTimeToIST(slot.date, slot.startTime));
  
  // Log for debugging - remove in production
  console.log('Updating datetime strings:', dateTimeStrings);
  
  const { data, error } = await supabase
    .from('bookings')
    .update({
      dates: dateTimeStrings, // Array of datetime strings: ["2026-01-24T01:20:00+05:30", ...]
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
    dateSlots: data.dates.map((dateTimeStr: string) => parseDateTimeFromIST(dateTimeStr)),
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
 * Check if any of the given date-time slots are already booked
 * @param dateSlots - Array of date-time slots to check
 * @param excludeBookingId - Optional booking ID to exclude from check (for updates)
 */
export const checkDateTimeAvailability = async (
  dateSlots: { date: Date; startTime: string }[],
  excludeBookingId?: string
): Promise<boolean> => {
  const dateTimeStrings = dateSlots.map((slot) => formatDateTimeToIST(slot.date, slot.startTime));

  // Fetch all bookings
  let query = supabase
    .from('bookings')
    .select('id, dates, full_name');

  // Exclude the current booking when updating
  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking date-time availability:', error);
    throw error;
  }

  if (data && data.length > 0) {
    // Check if any of the requested date-time slots conflict with existing bookings
    for (const booking of data) {
      for (const existingDateTime of booking.dates) {
        // Normalize old format (date only) to datetime format for comparison
        let normalizedExisting: string;
        if (existingDateTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Old format: date only - normalize to datetime with 00:00 IST
          normalizedExisting = `${existingDateTime}T00:00:00+05:30`;
        } else if (!existingDateTime.includes('+05:30') && !existingDateTime.includes('+0530')) {
          // Has T but no timezone - add IST timezone
          if (existingDateTime.includes('T')) {
            normalizedExisting = existingDateTime.endsWith('Z') 
              ? existingDateTime.replace('Z', '+05:30')
              : `${existingDateTime}+05:30`;
          } else {
            normalizedExisting = `${existingDateTime}T00:00:00+05:30`;
          }
        } else {
          normalizedExisting = existingDateTime;
        }
        
        if (dateTimeStrings.includes(normalizedExisting)) {
          console.log('Date-time conflict found:', normalizedExisting);
          return true;
        }
      }
    }
  }

  return false;
};

