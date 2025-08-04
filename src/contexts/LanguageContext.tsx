// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    'bookingSystem': 'Date Booking System',
    'selectDatesPrompt': 'Select consecutive dates to make a booking or view existing bookings',
    'selectDates': 'Select Dates',
    'clickToSelect': 'Click on dates to select (must be consecutive)',
    'selectedDates': 'Selected {count} consecutive dates',
    'bookSelectedDates': 'Book Selected Dates',
    'recentBookings': 'Recent Bookings',
    'viewBookings': 'View all booked dates and details',
    'noBookings': 'No bookings yet',
    'createFirstBooking': 'Select dates to create your first booking',
    'bookedDates': 'Booked dates',
    'selectedDatesLabel': 'Selected Dates:',
    'daysTotal': '{count} day{s} total',
    'days': '{date} day',
    'bookDate': 'Book Date',
    'editBooking': 'Edit Booking',
    'fullName': 'Full Name',
    'phoneNumber': 'Phone Number',
    'price': 'Price',
    'otherDetails': 'Other Details (Optional)',
    'enterFullName': 'Enter your full name',
    'enterPhone': 'Enter 10-digit mobile number',
    'enterAmount': 'Enter amount in rupees',
    'additionalInfo': 'Any additional information...',
    'cancel': 'Cancel',
    'updateBooking': 'Update Booking',
    'bookingDetails': 'Booking Details',
    'edit': 'Edit',
    'delete': 'Delete',
    'close': 'Close',
    'otherDetailsOnly': 'Other Details',
    'details': 'Details',
    'filterByMonth': 'Filter by Month',
    'allMonths': 'All Months',
    'noBookingsForMonth': 'No bookings for selected month',
    'tryDifferentMonth': 'Try selecting a different month',
    'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'weekdays': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'shortWeekdays': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },
  gu: {
    'bookingSystem': 'તારીખ બુકિંગ સિસ્ટમ',
    'selectDatesPrompt': 'બુકિંગ કરવા અથવા હાલની બુકિંગ જોવા સતત તારીખો પસંદ કરો',
    'selectDates': 'તારીખો પસંદ કરો',
    'clickToSelect': 'તારીખો પસંદ કરવા ક્લિક કરો (સતત હોવી જોઈએ)',
    'selectedDates': '{count} સતત તારીખો પસંદ કરી છે',
    'bookSelectedDates': 'પસંદ કરેલ તારીખો બુક કરો',
    'recentBookings': 'તાજેતરની બુકિંગ',
    'viewBookings': 'બધી બુક કરેલ તારીખો અને વિગતો જુઓ',
    'noBookings': 'હજુ સુધી કોઈ બુકિંગ નથી',
    'createFirstBooking': 'તમારી પહેલી બુકિંગ બનાવવા તારીખો પસંદ કરો',
    'bookedDates': 'બુક કરેલ તારીખો',
    'selectedDatesLabel': 'પસંદ કરેલ તારીખો:',
    'daysTotal': 'કુલ {count} દિવસ',
    'days': '{date} દિવસ',
    'bookDate': 'તારીખ બુક કરો',
    'editBooking': 'બુકિંગ સંપાદિત કરો',
    'fullName': 'પૂરું નામ',
    'phoneNumber': 'ફોન નંબર',
    'price': 'કિંમત',
    'otherDetails': 'અન્ય વિગતો (વૈકલ્પિક)',
    'details': 'વિગતો',
    'enterFullName': 'તમારું પૂરું નામ દાખલ કરો',
    'enterPhone': '10-અંકનો મોબાઇલ નંબર દાખલ કરો',
    'enterAmount': 'રૂપિયામાં રકમ દાખલ કરો',
    'additionalInfo': 'કોઈપણ વધારાની માહિતી...',
    'cancel': 'રદ કરો',
    'updateBooking': 'બુકિંગ અપડેટ કરો',
    'bookingDetails': 'બુકિંગ વિગતો',
    'edit': 'સંપાદિત કરો',
    'delete': 'કાઢી નાખો',
    'close': 'બંધ કરો',
    'otherDetailsOnly': 'અન્ય વિગતો',
    'filterByMonth': 'મહિના દ્વારા ફિલ્ટર કરો',
    'allMonths': 'બધા મહિના',
    'noBookingsForMonth': 'પસંદ કરેલ મહિના માટે કોઈ બુકિંગ નથી',
    'tryDifferentMonth': 'અલગ મહિના પસંદ કરવાનો પ્રયાસ કરો',
    'months': ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઑગસ્ટ', 'સપ્ટેમ્બર', 'ઑક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'],
    'weekdays': ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'],
    'shortWeekdays': ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
  }
};

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};