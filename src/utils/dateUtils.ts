// src/utils/dateUtils.ts
import { format, isSameDay } from "date-fns";
import { gu } from "date-fns/locale";

export const formatDate = (date: Date, formatStr: string, language: string) => {
  return format(date, formatStr, {
    locale: language === "gu" ? gu : undefined,
  });
};

/**
 * Convert 24-hour time format (HH:mm) to 12-hour AM/PM format
 * @param time24 - Time string in 24-hour format (e.g., "15:02", "00:00", "23:59")
 * @returns Time string in 12-hour AM/PM format (e.g., "03:02 PM", "12:00 AM", "11:59 PM")
 */
export const formatTimeToAMPM = (time24: string): string => {
  if (!time24 || !time24.includes(':')) {
    return time24 || '12:00 AM';
  }
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const minutesStr = String(minutes).padStart(2, '0');
  
  return `${hours12}:${minutesStr} ${period}`;
};
